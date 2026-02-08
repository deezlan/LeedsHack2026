"use client";

import React, { useMemo, useRef, useState } from "react";

type Phase = "idle" | "recording" | "transcribing" | "speaking" | "error";

export default function VoiceLoop() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [replyText, setReplyText] = useState("Got it. I heard you.");
  const [error, setError] = useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mimeTypeRef = useRef<string>("");
  const [audioUnlocked, setAudioUnlocked] = useState(false); //new


  const audioUrlRef = useRef<string | null>(null);

  const canStart = useMemo(() => phase === "idle" || phase === "error", [phase]);

  function cleanupAudioUrl() {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }

  function stopStreamTracks() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function pickSupportedMimeType() {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    for (const c of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
        return c;
      }
    }
    return "";
  }

  async function startRecording() {
    setError(null);
    setTranscript("");
    setSuggestedTags([]);
    cleanupAudioUrl();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const chosen = pickSupportedMimeType();
      mimeTypeRef.current = chosen;

      const mr = chosen
        ? new MediaRecorder(stream, { mimeType: chosen })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mr.onstop = () => {
        stopStreamTracks();
      };

      mr.start();
      setPhase("recording");
    } catch (e: any) {
      setPhase("error");
      setError("Mic permission failed: " + (e?.message || String(e)));
      stopStreamTracks();
    }
  }

  async function stopRecordingAndTranscribe() {
    const mr = mediaRecorderRef.current;
    if (!mr) return;

    setError(null);
    setPhase("transcribing");

    await new Promise<void>((resolve) => {
      const prevOnStop = mr.onstop;
      mr.onstop = () => {
        if (prevOnStop) prevOnStop(new Event("stop") as any);
        resolve();
      };
      mr.stop();
    });

    try {
      const recordedType = mimeTypeRef.current || mr.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: recordedType });

      const fd = new FormData();
      const ext = recordedType.includes("mp4") ? "mp4" : "webm";
      fd.append("file", blob, `recording.${ext}`);

      const resp = await fetch("/api/stt", { method: "POST", body: fd });
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data?.details || data?.error || "STT failed");
      }

      // ✅ FIXED: get transcript text properly
      const text = (data?.text || "").toString();
      setTranscript(text);

      // 🔥 CONNECT TRANSCRIPT TO TAGGING
      const tagResp = await fetch("/api/ai/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const tagData = await tagResp.json().catch(() => ({}));
      const tags: string[] = Array.isArray(tagData?.suggestedTags)
        ? tagData.suggestedTags
        : [];

      setSuggestedTags(tags);

      // 🎤 Narrator confirmation line
      const spoken =
        tags.length > 0
          ? `Got it. I tagged this as ${tags.slice(0, 3).join(", ")}. Creating your request now.`
          : `Got it. Creating your request now.`;

      setReplyText(spoken);
      if (audioUnlocked) {
        await speakText(spoken);
      } //so that it immediately speaks when there's a reply

      setPhase("idle");
    } catch (e: any) {
      setPhase("error");
      setError(String(e?.message || e));
    }
  }

  async function speakText(textToSpeak: string) {
    setError(null);
    cleanupAudioUrl();

    try {
        setPhase("speaking");

        const resp = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak }),
        });

        if (!resp.ok) {
        const err = await resp.text();
        throw new Error(err || "TTS failed");
        }

        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;

        const audio = new Audio(url);
        audio.onended = () => setPhase("idle");
        await audio.play();
    } catch (e: any) {
        setPhase("error");
        setError(String(e?.message || e));
    }
    }

  return (
    <div className="w-full max-w-xl space-y-4 rounded-2xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-black">
      <div className="text-lg font-semibold">Voice Loop (STT → Tagging → TTS)</div>

      <div className="text-sm">
        Status: {phase}
      </div>

      <div className="flex gap-2">
        <button onClick={startRecording} disabled={!canStart}>
          Start recording
        </button>

        <button onClick={stopRecordingAndTranscribe} disabled={phase !== "recording"}>
          Stop + transcribe
        </button>
        <button
            className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-50"
            onClick={async () => {
                try {
                // This creates a tiny silent audio play to satisfy autoplay policies
                const a = new Audio();
                a.src =
                    "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
                await a.play().catch(() => {});
                setAudioUnlocked(true);
                } catch {
                setAudioUnlocked(true); // still allow; some browsers don't need it
                }
            }}
            disabled={audioUnlocked}
            >
            {audioUnlocked ? "Audio enabled" : "Enable audio"}
        </button>


      </div>

      <div>
        <strong>Transcript:</strong>
        <div>{transcript || "No transcript yet"}</div>
      </div>

      <div>
        <strong>Suggested tags:</strong>
        <div>
          {suggestedTags.length > 0
            ? suggestedTags.join(", ")
            : "No tags yet"}
        </div>
      </div>

      <div>
        <strong>Reply text:</strong>
        <div>{replyText}</div>
      </div>

      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
}
