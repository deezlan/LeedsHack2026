"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { generateMatches, requestHelp } from "../../../../lib/api";
import type { MatchCard } from "../../../../lib/mock";

export default function MatchesPage() {
  const params = useParams<{ requestId: string }>();
  const requestIdParam = params?.requestId ?? "";
  const requestId = Array.isArray(requestIdParam)
    ? requestIdParam[0]
    : requestIdParam;

  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [requestingIds, setRequestingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!requestId) {
      setMatches([]);
      setLoading(false);
      return;
    }
    let isMounted = true;
    setLoading(true);
    setErrorMessage(null);
    setRequestedIds(new Set());
    setRequestingIds(new Set());
    setMatches([]);

    generateMatches(requestId)
      .then((data) => {
        if (!isMounted) return;
        setMatches(data as MatchCard[]);
      })
      .catch((error) => {
        if (!isMounted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load matches."
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [requestId]);

  const handleRequestHelp = async (matchId: string) => {
    if (requestedIds.has(matchId) || requestingIds.has(matchId)) return;
    setRequestingIds((prev) => new Set(prev).add(matchId));
    setErrorMessage(null);

    try {
      await requestHelp(matchId);
      setRequestedIds((prev) => new Set(prev).add(matchId));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not request help."
      );
    } finally {
      setRequestingIds((prev) => {
        const next = new Set(prev);
        next.delete(matchId);
        return next;
      });
    }
  };

  const matchList = useMemo(() => matches, [matches]);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Matches
        </p>
        <h1 className="text-3xl font-semibold">Recommended helpers</h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Review matches for request{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {requestId}
          </span>{" "}
          and send a request when you are ready.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-zinc-300/80 bg-white/60 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
          Generating matches...
        </div>
      ) : errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
          {errorMessage}
        </div>
      ) : matchList.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          No matches yet. Try adjusting your request details.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {matchList.map((match) => {
            const isRequested = requestedIds.has(match.id);
            const isRequesting = requestingIds.has(match.id);
            const scoreLabel = `${Math.round(match.score * 100)}%`;

            return (
              <div
                key={match.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                      Helper
                    </p>
                    <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                      {match.helperName}
                    </p>
                  </div>
                  <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                    Match {scoreLabel}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                    Reasons
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                    {match.reasons.map((reason) => (
                      <li key={reason}>- {reason}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Request a session with this helper.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRequestHelp(match.id)}
                    disabled={isRequested || isRequesting}
                    className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-600"
                  >
                    {isRequested
                      ? "Requested"
                      : isRequesting
                      ? "Requesting..."
                      : "Request help"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
