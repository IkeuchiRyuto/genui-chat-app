"use client";

import { useState, useRef, useEffect } from "react";

export default function AudioPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Int16Array[]>([]);
  const [status, setStatus] = useState("待機中");

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
          setStatus(`録音中... (RMS: ${event.data.rms.toFixed(4)})`);
        } else if (event.data.type === "silence") {
          setStatus("録音中... (無音)");
        }
      };

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

      // 録音開始を通知
      workletNode.port.postMessage({ type: "setRecording", value: true });

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
    const playContext = new AudioContext({ sampleRate: 24000 }); // 録音時に24kHzにリサンプリングされている
    const audioBuffer = playContext.createBuffer(1, floatBuffer.length, 24000);
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
