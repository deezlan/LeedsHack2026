"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "@/src/hooks/useDebounce";

type Phase = "idle" | "recording" | "transcribing" | "error";

export default function VoiceLoop({
  description,
  onTranscript,
  onTags,
  onReply,
}: {
  description: string;
  onTranscript: (text: string) => void;
  onTags: (tags: string[]) => void;
  onReply: (reply: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const debouncedText = useDebounce(description, 800);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const canStart = useMemo(
    () => phase === "idle" || phase === "error",
    [phase]
  );

  function stopStreamTracks() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startRecording() {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => stopStreamTracks();

      mr.start();
      setPhase("recording");
    } catch {
      setPhase("error");
      setError("Microphone permission failed.");
    }
  }

  async function stopRecording() {
    const mr = mediaRecorderRef.current;
    if (!mr) return;

    setPhase("transcribing");

    await new Promise<void>((resolve) => {
      mr.onstop = () => resolve();
      mr.stop();
    });

    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });

      const fd = new FormData();
      fd.append("file", blob, "audio.webm");

      const resp = await fetch("/api/stt", { method: "POST", body: fd });
      const data = await resp.json();

      if (!resp.ok) throw new Error(data?.error || "STT failed");

      const text = data.text || "";

      onTranscript(text);

      await runTagging(text);

      setPhase("idle");
    } catch (e: any) {
      setPhase("error");
      setError(e.message);
    }
  }

  async function runTagging(text: string) {
    if (!text.trim()) return;

    const resp = await fetch("/api/ai/suggest-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await resp.json();

    const tags: string[] = data?.suggestedTags ?? [];
    const reply: string = data?.reply ?? "Got it.";

    onTags(tags);
    onReply(reply);
  }

  // typing → debounce → tagging
  useEffect(() => {
    runTagging(debouncedText);
  }, [debouncedText]);

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500">Voice assistant</div>

      <div className="flex items-center gap-4">
        <button
          onClick={startRecording}
          disabled={!canStart}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium
                    bg-white hover:bg-gray-50 transition
                    disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Record
        </button>

        <button
          onClick={stopRecording}
          disabled={phase !== "recording"}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium
                    bg-white hover:bg-gray-50 transition
                    disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Stop
        </button>
      </div>


      {error && <div className="text-red-500 text-xs">{error}</div>}
    </div>
  );
}
