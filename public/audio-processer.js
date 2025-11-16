// AudioWorkletProcessor for real-time audio streaming to Azure OpenAI Realtime API
class RealtimeAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferAccumulator = [];
    this.lastSendTime = currentTime;
    this.chunkDuration = 0.5;
    this.audioThreshold = 0.01;
    this.isRecording = true;

    // ノイズ除去設定
    this.enableNoiseReduction = true;
    this.noiseGateThreshold = 0.02; // より高い閾値
    this.highpassCutoff = 300; // Hz - 人間の声の下限
    this.lowpassCutoff = 3400; // Hz - 人間の声の上限

    // バンドパスフィルター用のバッファ（IIRフィルターの状態保持）
    this.filterStateHigh = { x1: 0, x2: 0, y1: 0, y2: 0 };
    this.filterStateLow = { x1: 0, x2: 0, y1: 0, y2: 0 };

    // フィルター係数を計算
    this.calculateFilterCoefficients();

    this.port.onmessage = (event) => {
      if (event.data.type === "setRecording") {
        this.isRecording = event.data.value;
      } else if (event.data.type === "setNoiseReduction") {
        this.enableNoiseReduction = event.data.value;
      } else if (event.data.type === "setNoiseGateThreshold") {
        this.noiseGateThreshold = event.data.value;
      }
    };
  }

  // バターワースフィルター係数の計算（簡易版）
  calculateFilterCoefficients() {
    const fs = sampleRate;

    // ハイパスフィルター（300Hz）
    const omegaH = (2 * Math.PI * this.highpassCutoff) / fs;
    const QH = 0.707; // バターワース
    const K_H = Math.tan(omegaH / 2);
    const norm_H = 1 / (1 + K_H / QH + K_H * K_H);

    this.highpassCoeffs = {
      b0: norm_H,
      b1: -2 * norm_H,
      b2: norm_H,
      a1: 2 * (K_H * K_H - 1) * norm_H,
      a2: (1 - K_H / QH + K_H * K_H) * norm_H,
    };

    // ローパスフィルター（3400Hz）
    const omegaL = (2 * Math.PI * this.lowpassCutoff) / fs;
    const QL = 0.707;
    const K_L = Math.tan(omegaL / 2);
    const norm_L = 1 / (1 + K_L / QL + K_L * K_L);

    this.lowpassCoeffs = {
      b0: K_L * K_L * norm_L,
      b1: 2 * K_L * K_L * norm_L,
      b2: K_L * K_L * norm_L,
      a1: 2 * (K_L * K_L - 1) * norm_L,
      a2: (1 - K_L / QL + K_L * K_L) * norm_L,
    };
  }

  // バイクアッド（IIR）フィルターの適用
  applyBiquadFilter(sample, coeffs, state) {
    const output =
      coeffs.b0 * sample +
      coeffs.b1 * state.x1 +
      coeffs.b2 * state.x2 -
      coeffs.a1 * state.y1 -
      coeffs.a2 * state.y2;

    state.x2 = state.x1;
    state.x1 = sample;
    state.y2 = state.y1;
    state.y1 = output;

    return output;
  }

  // バンドパスフィルターの適用（ハイパス + ローパス）
  applyBandpassFilter(data) {
    const filtered = new Float32Array(data.length);

    for (let i = 0; i < data.length; i++) {
      // ハイパスフィルター適用
      let sample = this.applyBiquadFilter(
        data[i],
        this.highpassCoeffs,
        this.filterStateHigh,
      );
      // ローパスフィルター適用
      sample = this.applyBiquadFilter(
        sample,
        this.lowpassCoeffs,
        this.filterStateLow,
      );
      filtered[i] = sample;
    }

    return filtered;
  }

  // ノイズゲートの適用
  applyNoiseGate(data, rms) {
    if (rms < this.noiseGateThreshold) {
      // 閾値以下の場合はミュート
      return new Float32Array(data.length);
    }
    return data;
  }

  calculateRMS(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }

  mergeBuffers(chunks) {
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const merged = new Float32Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    return merged;
  }

  resampleLinear(data, srcRate, dstRate) {
    if (srcRate === dstRate) return data;
    const ratio = srcRate / dstRate;
    const newLength = Math.round(data.length / ratio);
    const out = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const i0 = Math.floor(srcIndex);
      const i1 = Math.min(i0 + 1, data.length - 1);
      const frac = srcIndex - i0;
      out[i] = data[i0] * (1 - frac) + data[i1] * frac;
    }
    return out;
  }

  floatTo16BitPCM(data) {
    const out = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const s = Math.max(-1, Math.min(1, data[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }

  process(inputs) {
    const input = inputs[0];

    if (!input || !input.length || !this.isRecording) {
      return true;
    }

    const inputChannel = input[0];

    this.bufferAccumulator.push(new Float32Array(inputChannel));

    if (currentTime - this.lastSendTime >= this.chunkDuration) {
      let merged = this.mergeBuffers(this.bufferAccumulator);
      this.bufferAccumulator = [];

      // ノイズ除去が有効な場合、フィルターを適用
      if (this.enableNoiseReduction) {
        merged = this.applyBandpassFilter(merged);
      }

      const rms = this.calculateRMS(merged);

      // ノイズゲートを適用
      if (this.enableNoiseReduction) {
        merged = this.applyNoiseGate(merged, rms);
      }

      if (rms > this.audioThreshold) {
        // Resample from 48kHz to 24kHz
        const resampled = this.resampleLinear(merged, sampleRate, 24000);
        const pcm16 = this.floatTo16BitPCM(resampled);

        this.port.postMessage({
          type: "audioData",
          pcm16: pcm16,
          rms: rms,
          filtered: this.enableNoiseReduction,
        });
      } else {
        this.port.postMessage({
          type: "silence",
        });
      }

      this.lastSendTime = currentTime;
    }

    return true;
  }
}

registerProcessor("realtime-audio-processor", RealtimeAudioProcessor);
