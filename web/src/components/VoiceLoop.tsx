"use client";

export default function VoiceLoop() {
    return (
        <div className="w-full max-w-xl space-y-4 rounded-2xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-black">
            <div className="text-lg font-semibold">Voice Loop (STT → Tagging → TTS)</div>

            <div className="text-sm">
                Status: <span>idle</span>
            </div>

            <div className="flex gap-2">
                <button disabled className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-50">
                    Start recording
                </button>

                <button disabled className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-50">
                    Stop + transcribe
                </button>

                <button disabled className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-50">
                    Enable audio
                </button>
            </div>

            <div>
                <strong>Transcript:</strong>
                <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                    No transcript yet
                </div>
            </div>

            <div>
                <strong>Suggested tags:</strong>
                <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                    No tags yet
                </div>
            </div>

            <div>
                <strong>Reply text:</strong>
                <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                    Got it. I heard you.
                </div>
            </div>

            {/* Error placeholder (hidden) */}
            <div className="hidden text-sm text-red-600">Error message goes here</div>
        </div>
    );
}