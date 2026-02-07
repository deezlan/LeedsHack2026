"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { mockMatches } from "../../../../lib/mock";

export default function ConnectionPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params?.matchId ?? "";

  const match = useMemo(
    () => mockMatches.find((item) => item.id === matchId),
    [matchId]
  );

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Connections
        </p>
        <h1 className="text-3xl font-semibold">Connection</h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Continue the conversation and coordinate next steps.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Next steps
          </h2>
          <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
              Message them
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
              Schedule a call
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
              Share details
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Match summary
          </h2>
          {match ? (
            <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                  Helper
                </p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {match.helperName}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                  Score
                </p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {(match.score * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                  Reasons
                </p>
                <ul className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                  {match.reasons.map((reason) => (
                    <li key={reason}>- {reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              Match details unavailable for <span className="font-medium">{matchId}</span>.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
