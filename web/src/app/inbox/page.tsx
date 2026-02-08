"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getInbox, respondToMatch } from "../../../lib/api";
import { useRequireAuth } from "@/src/hooks/useRequireAuth";

type InboxStatus =
  | "unread"
  | "read"
  | "action-needed"
  | "accepted"
  | "declined";

type InboxItem = {
  matchId: string;
  requestId: string;
  fromUserName: string;
  preview: string;
  status: InboxStatus;
};

const helperId = "u2";

const statusConfig: Record<InboxStatus, { label: string; className: string }> = {
  unread: { label: "Unread", className: "bg-leeds-teal/10 text-leeds-teal" },
  read: { label: "Read", className: "bg-gray-100 text-gray-600" },
  "action-needed": { label: "Action Needed", className: "bg-amber-100 text-amber-700 font-bold" },
  accepted: { label: "Accepted", className: "bg-emerald-100 text-emerald-700" },
  declined: { label: "Declined", className: "bg-rose-100 text-rose-700" },
};

export default function InboxPage() {
  const session = useRequireAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionIds, setActionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!session) return;
    let isMounted = true;
    setLoading(true);
    setErrorMessage(null);

    getInbox(session.userId)
      .then((data) => {
        if (!isMounted) return;
        setItems(data as InboxItem[]);
      })
      .catch((error) => {
        if (!isMounted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load inbox."
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  const handleDecision = async (
    matchId: string,
    decision: "accepted" | "declined"
  ) => {
    setActionIds((prev) => new Set(prev).add(matchId));
    setErrorMessage(null);

    try {
      await respondToMatch(matchId, decision);

      // Re-fetch inbox so it reflects backend state
      const refreshed = await getInbox(helperId);
      setItems(refreshed as InboxItem[]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not update match.");
    } finally {
      setActionIds((prev) => {
        const next = new Set(prev);
        next.delete(matchId);
        return next;
      });
    }
  };

  const itemList = useMemo(() => items, [items]);

  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeUp">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-leeds-blue tracking-tight">Inbox</h1>
        <div className="flex items-center justify-between">
          <p className="text-leeds-blue-dark/70">
            Manage your connections and requests.
          </p>
          {!loading && (
            <span className="text-sm font-medium text-leeds-teal bg-leeds-teal/10 px-3 py-1 rounded-full">
              {itemList.length} Messages
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-white border border-leeds-border animate-pulse" />
          ))}
        </div>
      ) : errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p>{errorMessage}</p>
        </div>
      ) : itemList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-leeds-border">
          <div className="w-16 h-16 bg-leeds-cream rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            📭
          </div>
          <h3 className="text-lg font-bold text-leeds-blue-dark">All caught up</h3>
          <p className="text-gray-500 mt-2">No new messages or requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {itemList.map((item) => {
            const isActing = actionIds.has(item.matchId);
            const isResolved =
              item.status === "accepted" || item.status === "declined";
            const statusFn = statusConfig[item.status] || statusConfig.unread;

            // Initials
            const initials = item.fromUserName
              .split(" ")
              .map(n => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={item.matchId}
                className={`group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border transition-all duration-200 ${item.status === 'unread' || item.status === 'action-needed'
                    ? "border-leeds-teal/30 shadow-md shadow-leeds-teal/5"
                    : "border-leeds-border shadow-sm hover:shadow-md"
                  }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${item.status === 'unread' || item.status === 'action-needed'
                      ? "bg-leeds-teal text-leeds-blue-dark"
                      : "bg-leeds-cream text-leeds-blue-dark/60"
                    }`}>
                    {initials}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-base font-semibold truncate ${item.status === 'unread'
                        ? "text-leeds-blue-dark"
                        : "text-gray-700"
                      }`}>
                      {item.fromUserName}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusFn.className}`}>
                      {statusFn.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {item.preview}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Request ID: {item.requestId}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                  {/* If accepted, show open connection */}
                  {item.status === "accepted" && (
                    <Link
                      href={`/connections/${item.matchId}`}
                      className="whitespace-nowrap rounded-full bg-leeds-blue text-white px-4 py-2 text-xs font-bold shadow-sm hover:bg-leeds-blue-dark transition-colors"
                    >
                      Open Connection
                    </Link>
                  )}

                  {/* If declined, show nothing or minimal text */}
                  {item.status === "declined" && (
                    <span className="text-xs text-gray-400 font-medium">Declined</span>
                  )}

                  {/* If actionable */}
                  {item.status === "action-needed" && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDecision(item.matchId, "declined")}
                        disabled={isActing}
                        className="px-4 py-2 rounded-full border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision(item.matchId, "accepted")}
                        disabled={isActing}
                        className="px-4 py-2 rounded-full bg-leeds-teal text-leeds-blue-dark text-xs font-bold shadow-sm hover:bg-leeds-teal-dark hover:text-white transition-all disabled:opacity-50"
                      >
                        {isActing ? "..." : "Accept"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
