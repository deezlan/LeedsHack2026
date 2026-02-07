"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { getMatch, getMessages, sendMessage } from "../../../../lib/api";
import type { ConnectionMessage } from "../../../../lib/types";
import type { MatchCard } from "../../../../lib/mock";

export default function ConnectionPage() {
  const params = useParams<{ matchId: string }>();
  const matchIdParam = params?.matchId ?? "";
  const matchId = Array.isArray(matchIdParam) ? matchIdParam[0] : matchIdParam;
  const CURRENT_USER_ID = "u2"; // your helperId for now
  const CURRENT_ROLE: "helper" | "requester" = "helper";
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [message, setMessage] = useState("");
  const [match, setMatch] = useState<MatchCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConnectionMessage[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!matchId) {
      setMatch(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setErrorMessage(null);

    getMatch(matchId)
      .then(async (m) => {
        if (!isMounted) return;
        setMatch(m);

        if (m.state === "accepted") {
          const msgs = await getMessages(matchId);
          if (!isMounted) return;
          setMessages(msgs);
        } else {
          setMessages([]);
        }
      })
      .catch((e) => {
        if (!isMounted) return;
        setErrorMessage(e instanceof Error ? e.message : "Failed to load connection.");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [matchId]);

  useEffect(() => {
    // call whenever messages changes
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]); // or [messages]

  const initials = useMemo(() => {
    if (!match?.helperName) return "?";
    return match.helperName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [match?.helperName]);

  const scorePercent = match ? Math.round(match.score * 100) : 0;

  const stateBadge =
    match?.state === "accepted"
      ? "bg-emerald-100 text-emerald-700"
      : match?.state === "requested"
        ? "bg-amber-100 text-amber-700 font-bold"
        : match?.state === "declined"
          ? "bg-rose-100 text-rose-700"
          : "bg-gray-100 text-gray-600";

  const onSend = async () => {
    if (!match || match.state !== "accepted") return;

    const text = message.trim();
    if (!text) return;

    setSending(true);
    setErrorMessage(null);

    try {
      const created = await sendMessage({
        matchId: match.id,
        senderId: CURRENT_USER_ID,
        senderRole: CURRENT_ROLE,
        text,
      });

      // update UI immediately
      setMessages((prev) => [...prev, created]);
      setMessage("");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[600px] flex flex-col lg:flex-row gap-6 animate-fadeUp">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-leeds-border shadow-sm overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-leeds-border flex items-center justify-between bg-leeds-cream/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-leeds-blue flex items-center justify-center text-white font-bold shadow-sm">
              {initials}
            </div>
            <div>
              <h2 className="font-bold text-leeds-blue-dark">
                {match?.helperName ?? (loading ? "Loading..." : "Unknown Helper")}
              </h2>
              <p className="text-xs text-leeds-teal font-medium flex items-center gap-1">
                <span className="block w-1.5 h-1.5 rounded-full bg-leeds-teal animate-pulse" />
                Online
              </p>
            </div>
          </div>
          {match?.state && (
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${stateBadge}`}>
              {match.state}
            </span>
          )}
        </div>

        {/* Chat Messages Placeholder */}
        <div ref={scrollRef} className="flex-1 p-6 bg-leeds-cream/20 overflow-y-auto space-y-6">
          {loading ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">Loading connection…</div>
          ) : errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
              <p className="font-semibold">Couldn’t load this connection</p>
              <p className="text-sm mt-1">{errorMessage}</p>
            </div>
          ) : match?.state !== "accepted" ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-70">
              <div className="w-16 h-16 bg-leeds-blue/5 rounded-full flex items-center justify-center text-2xl">
                ⏳
              </div>
              <p className="text-sm text-gray-600 max-w-sm">
                This connection isn’t active yet.
                {match?.state === "requested" && " Waiting for the helper to accept."}
                {match?.state === "declined" && " The helper declined this request."}
              </p>
            </div>
          ) : (
            <>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
                  <div className="w-16 h-16 bg-leeds-blue/5 rounded-full flex items-center justify-center text-2xl">
                    👋
                  </div>
                  <p className="text-sm text-gray-500 max-w-xs">
                    This is the start of your conversation with{" "}
                    <span className="font-semibold text-leeds-blue-dark">{match?.helperName}</span>.
                    Say hello and share your request details!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m) => {
                    const isMine = m.senderId === CURRENT_USER_ID;

                    return (
                      <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                            isMine
                              ? "bg-leeds-blue text-white"
                              : "bg-white border border-leeds-border text-leeds-blue-dark"
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words">{m.text}</div>
                          <div className={`mt-1 text-[10px] opacity-70 ${isMine ? "text-white/70" : "text-gray-400"}`}>
                            {new Date(m.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-leeds-border">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onSend();
            }}
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={match?.state === "accepted" ? "Type a message..." : "Connection not active yet"}
              disabled={match?.state !== "accepted"}
              className="flex-1 rounded-full border border-leeds-border bg-gray-50 px-4 py-2.5 text-sm focus:border-leeds-teal focus:ring-2 focus:ring-leeds-teal/20 outline-none transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !message.trim() || match?.state !== "accepted"}
              className="rounded-full bg-leeds-blue text-white px-5 py-2.5 text-sm font-bold shadow-sm hover:bg-leeds-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar Info */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-leeds-border p-5 shadow-sm">
          <h3 className="text-sm font-bold text-leeds-blue-dark mb-4">Match Details</h3>

          {match ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-leeds-cream rounded-xl">
                <span className="text-xs font-semibold text-gray-500">Compatibility</span>
                <span className="text-lg font-bold text-leeds-teal">{scorePercent}%</span>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Why you matched</h4>
                <ul className="space-y-2">
                  {match.reasons.map((reason, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="text-leeds-teal mt-0.5">•</span>
                      <span className="leading-snug">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Details not available.</p>
          )}
        </div>

        <div className="bg-leeds-blue rounded-2xl border border-leeds-blue-dark p-5 shadow-sm text-white">
          <h3 className="text-sm font-bold mb-2">Next Steps</h3>

          {match?.state === "accepted" && match.connectionPayload ? (
            <ul className="space-y-3 text-xs text-white/80">
              {match.connectionPayload.message && (
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
                  {(match as any).connectionPayload.message}
                </li>
              )}
              {match.connectionPayload.nextStep && (
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
                  {(match as any).connectionPayload.nextStep}
                </li>
              )}
              {!match.connectionPayload.message && !match.connectionPayload.nextStep && (
                <li className="text-xs text-white/80">Connection accepted — send a message to start.</li>
              )}
            </ul>
          ) : (
            <ul className="space-y-3 text-xs text-white/80">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
                Introduce yourself and your project.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
                Schedule a 15-min intro call.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">3</span>
                Share documents or repo links.
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
