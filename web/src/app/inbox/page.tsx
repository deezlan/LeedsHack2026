"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getInbox, respondToMatch } from "../../../lib/api";

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

const helperId = "h1";

const statusLabel: Record<InboxStatus, string> = {
  unread: "Unread",
  read: "Read",
  "action-needed": "Action needed",
  accepted: "Accepted",
  declined: "Declined",
};

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionIds, setActionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMessage(null);

    getInbox(helperId)
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
  }, []);

  const handleDecision = async (
    matchId: string,
    decision: "accepted" | "declined"
  ) => {
    setActionIds((prev) => new Set(prev).add(matchId));
    setErrorMessage(null);

    try {
      await respondToMatch(matchId, decision);
      setItems((prev) =>
        prev.map((item) =>
          item.matchId === matchId ? { ...item, status: decision } : item
        )
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not update match."
      );
    } finally {
      setActionIds((prev) => {
        const next = new Set(prev);
        next.delete(matchId);
        return next;
      });
    }
  };

  const itemList = useMemo(() => items, [items]);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Inbox
        </p>
        <h1 className="text-3xl font-semibold">Messages</h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Review match requests and respond when you are ready.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-zinc-300/80 bg-white/60 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
          Loading inbox...
        </div>
      ) : errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
          {errorMessage}
        </div>
      ) : (
        <div className="grid gap-3">
          {itemList.map((item) => {
            const isActing = actionIds.has(item.matchId);
            const isResolved =
              item.status === "accepted" || item.status === "declined";

            return (
              <div
                key={item.matchId}
                className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {item.fromUserName}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {item.preview}
                    </p>
                  </div>
                  <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                    {statusLabel[item.status]}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecision(item.matchId, "accepted")}
                    disabled={isResolved || isActing}
                    className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-600"
                  >
                    {isActing ? "Updating..." : "Accept"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(item.matchId, "declined")}
                    disabled={isResolved || isActing}
                    className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-600"
                  >
                    Decline
                  </button>
                  {item.status === "accepted" && (
                    <Link
                      href={`/connections/${item.matchId}`}
                      className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:border-emerald-300 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200"
                    >
                      Open connection
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
