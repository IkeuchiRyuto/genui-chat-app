// AudioWorkletProcessor for real-time audio streaming to Azure OpenAI Realtime API
class RealtimeAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferAccumulator = [];
    this.lastSendTime = currentTime;
    this.chunkDuration = 0.5;
    this.audioThreshold = 0.01;
    this.isRecording = true;

    this.port.onmessage = (event) => {
      if (event.data.type === "setRecording") {
        this.isRecording = event.data.value;
      }
    };
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
      const merged = this.mergeBuffers(this.bufferAccumulator);
      this.bufferAccumulator = [];

      const rms = this.calculateRMS(merged);

      if (rms > this.audioThreshold) {
        // Resample from 48kHz to 24kHz
        const resampled = this.resampleLinear(merged, sampleRate, 24000);
        const pcm16 = this.floatTo16BitPCM(resampled);

        this.port.postMessage({
          type: "audioData",
          pcm16: pcm16,
          rms: rms,
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
