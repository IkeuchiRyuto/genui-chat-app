"use client";

import { useState, useRef, useEffect } from "react";

export default function AudioPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Int16Array[]>([]);
  const [status, setStatus] = useState("待機中");
  const [enableNoiseReduction, setEnableNoiseReduction] = useState(true);
  const [noiseGateThreshold, setNoiseGateThreshold] = useState(0.02);

  // ブラウザ標準のエコーキャンセレーション設定
  const [enableEchoCancellation, setEnableEchoCancellation] = useState(true);
  const [enableNoiseSuppression, setEnableNoiseSuppression] = useState(true);
  const [enableAutoGainControl, setEnableAutoGainControl] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioBufferRef = useRef<Int16Array[]>([]);

  useEffect(() => {
    return () => {
      // クリーンアップ
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setStatus("マイクへのアクセスを要求中...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          echoCancellation: enableEchoCancellation,
          noiseSuppression: enableNoiseSuppression,
          autoGainControl: enableAutoGainControl,
        },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 48000 });
      audioContextRef.current = audioContext;

      setStatus("AudioWorkletを読み込み中...");

      await audioContext.audioWorklet.addModule("/audio-processer.js");

      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(
        audioContext,
        "realtime-audio-processor",
      );
      workletNodeRef.current = workletNode;

      // AudioWorkletからのメッセージを受信
      workletNode.port.onmessage = (event) => {
        if (event.data.type === "audioData") {
          audioBufferRef.current.push(event.data.pcm16);
          const filterStatus = event.data.filtered ? " [フィルター有効]" : "";
          setStatus(
            `録音中... (RMS: ${event.data.rms.toFixed(4)})${filterStatus}`,
          );
        } else if (event.data.type === "silence") {
          setStatus("録音中... (無音)");
        }
      };

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

      // 録音開始とノイズ除去設定を通知
      workletNode.port.postMessage({ type: "setRecording", value: true });
      workletNode.port.postMessage({
        type: "setNoiseReduction",
        value: enableNoiseReduction,
      });
      workletNode.port.postMessage({
        type: "setNoiseGateThreshold",
        value: noiseGateThreshold,
      });

      setIsRecording(true);
      setStatus("録音中...");
      audioBufferRef.current = [];
    } catch (error) {
      console.error("録音の開始に失敗しました:", error);
      setStatus(
        `エラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
      );
    }
  };

  const stopRecording = () => {
    if (workletNodeRef.current) {
      // 録音停止を通知
      workletNodeRef.current.port.postMessage({
        type: "setRecording",
        value: false,
      });
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // 録音データを保存
    setAudioChunks([...audioBufferRef.current]);
    setIsRecording(false);
    setStatus(`録音停止 (${audioBufferRef.current.length}チャンク保存)`);
  };

  const playRecording = () => {
    if (audioChunks.length === 0) {
      setStatus("再生するデータがありません");
      return;
    }

    setStatus("再生中...");

    // すべてのチャンクを結合
    const totalLength = audioChunks.reduce(
      (sum, chunk) => sum + chunk.length,
      0,
    );
    const mergedBuffer = new Int16Array(totalLength);
    let offset = 0;

    for (const chunk of audioChunks) {
      mergedBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Int16ArrayをFloat32Arrayに変換 (AudioBufferはFloat32を使用)
    const floatBuffer = new Float32Array(mergedBuffer.length);
    for (let i = 0; i < mergedBuffer.length; i++) {
      floatBuffer[i] =
        mergedBuffer[i] / (mergedBuffer[i] < 0 ? 0x8000 : 0x7fff);
    }

    // AudioContextで再生
    const playContext = new AudioContext({ sampleRate: 24000 });
    const audioBuffer = playContext.createBuffer(
      1,
      floatBuffer.length,
      24000,
    );
    audioBuffer.copyToChannel(floatBuffer, 0);

    const source = playContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(playContext.destination);

    source.onended = () => {
      setStatus("再生完了");
      playContext.close();
    };

    source.start();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-auto p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100">
          音声録音・再生
        </h1>

        <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            ステータス:
          </p>
          <p className="font-mono text-sm text-gray-800 dark:text-gray-100">
            {status}
          </p>
          {audioChunks.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              録音データ: {audioChunks.length} チャンク
            </p>
          )}
        </div>

        {/* ノイズ除去設定 */}
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">
            🎚️ ノイズ除去設定
          </h3>

          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              バンドパスフィルター (300-3400Hz)
            </label>
            <button
              onClick={() => setEnableNoiseReduction(!enableNoiseReduction)}
              disabled={isRecording}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                enableNoiseReduction
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500"
              } ${
                isRecording ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {enableNoiseReduction ? "ON" : "OFF"}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-700 dark:text-gray-300 block">
              ノイズゲート閾値: {noiseGateThreshold.toFixed(3)}
            </label>
            <input
              type="range"
              min="0.005"
              max="0.1"
              step="0.005"
              value={noiseGateThreshold}
              onChange={(e) =>
                setNoiseGateThreshold(parseFloat(e.target.value))
              }
              disabled={isRecording || !enableNoiseReduction}
              className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              低い値: より敏感（小さな音も録音） / 高い値: よりノイズカット
            </p>
          </div>
        </div>

        {/* ブラウザ標準の音声処理 */}
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">
            🔊 エコー・機械音除去設定
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  エコーキャンセレーション
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  スピーカーからの音を除去
                </p>
              </div>
              <button
                onClick={() =>
                  setEnableEchoCancellation(!enableEchoCancellation)
                }
                disabled={isRecording}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  enableEchoCancellation
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500"
                } ${
                  isRecording
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {enableEchoCancellation ? "ON" : "OFF"}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  ノイズサプレッション
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  環境ノイズを自動除去
                </p>
              </div>
              <button
                onClick={() =>
                  setEnableNoiseSuppression(!enableNoiseSuppression)
                }
                disabled={isRecording}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  enableNoiseSuppression
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500"
                } ${
                  isRecording
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {enableNoiseSuppression ? "ON" : "OFF"}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  自動ゲインコントロール
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  音量を自動調整
                </p>
              </div>
              <button
                onClick={() => setEnableAutoGainControl(!enableAutoGainControl)}
                disabled={isRecording}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  enableAutoGainControl
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500"
                } ${
                  isRecording
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {enableAutoGainControl ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={startRecording}
            disabled={isRecording}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
              isRecording
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600 active:scale-95 shadow-lg hover:shadow-xl"
            }`}
          >
            🎤 録音
          </button>

          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
              !isRecording
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 active:scale-95 shadow-lg hover:shadow-xl"
            }`}
          >
            ⏹ 停止
          </button>

          <button
            onClick={playRecording}
            disabled={isRecording || audioChunks.length === 0}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
              isRecording || audioChunks.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 active:scale-95 shadow-lg hover:shadow-xl"
            }`}
          >
            ▶️ 再生
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-gray-600 dark:text-gray-300">
            <strong>使い方:</strong>
            <br />
            1. 「録音」ボタンをクリックしてマイクへのアクセスを許可
            <br />
            2. 音声を入力
            <br />
            3. 「停止」ボタンで録音を終了
            <br />
            4. 「再生」ボタンで録音した音声を確認
          </p>
        </div>
      </div>
    </div>
  );
}
