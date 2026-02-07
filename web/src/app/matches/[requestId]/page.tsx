"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { generateMatches, requestHelp } from "../../../../lib/api";
import type { MatchCard } from "../../../../lib/mock";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function MatchesPage() {
  const session = useRequireAuth();
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

  if (!session) return null;

  return (
    <div className="space-y-8 animate-fadeUp">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-leeds-blue tracking-tight">Recommended Helpers</h1>
        <p className="text-leeds-blue-dark/70">
          We found these experts for your request <span className="font-semibold text-leeds-teal">#{requestId}</span>.
        </p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-white border border-leeds-border animate-pulse" />
          ))}
        </div>
      ) : errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p className="font-semibold">Oops!</p>
          <p className="text-sm mt-1">{errorMessage}</p>
        </div>
      ) : matchList.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-leeds-border">
          <p className="text-leeds-blue-dark font-medium">No matches found yet.</p>
          <p className="text-sm text-gray-500 mt-2">Try updating your request with more popular tags.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {matchList.map((match) => {
            const isRequested = requestedIds.has(match.id);
            const isRequesting = requestingIds.has(match.id);
            const scorePercent = Math.round(match.score * 100);

            // Generate initials
            const initials = match.helperName
              .split(" ")
              .map(n => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={match.id}
                className="group relative flex flex-col bg-white rounded-2xl border border-leeds-border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-leeds-blue flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:bg-leeds-teal transition-colors">
                      {initials}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${scorePercent > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-leeds-cream text-leeds-blue'
                      }`}>
                      {scorePercent}% Match
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-leeds-blue-dark group-hover:text-leeds-blue transition-colors">
                    {match.helperName}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">Frontend • React • UI/UX</p> {/* Hardcoded placeholder for now or derive from match reasons? */}
                </div>

                {/* Body - Reasons */}
                <div className="px-6 py-2 flex-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Why they matched</p>
                  <ul className="space-y-2">
                    {match.reasons.map((reason, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-leeds-teal mt-0.5">•</span>
                        <span className="leading-snug">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer - Action */}
                <div className="p-6 pt-4 mt-auto">
                  <button
                    type="button"
                    onClick={() => handleRequestHelp(match.id)}
                    disabled={isRequested || isRequesting}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${isRequested
                        ? "bg-gray-100 text-gray-500 cursor-default"
                        : "bg-leeds-blue text-white shadow-md hover:bg-leeds-teal hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                      }`}
                  >
                    {isRequested
                      ? "Request Sent"
                      : isRequesting
                        ? "Sending..."
                        : "Connect"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
