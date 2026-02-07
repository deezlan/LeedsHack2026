"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { mockMatches } from "../../../../lib/mock";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function ConnectionPage() {
  const session = useRequireAuth();
  const params = useParams<{ matchId: string }>();
  const matchIdParam = params?.matchId ?? "";
  const matchId = Array.isArray(matchIdParam) ? matchIdParam[0] : matchIdParam;

  const [message, setMessage] = useState("");

  const match = useMemo(
    () => mockMatches.find((item) => item.id === matchId),
    [matchId]
  );

  const initials = match?.helperName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (!session) return null;

  return (
    <div className="h-[calc(100vh-140px)] min-h-[600px] flex flex-col lg:flex-row gap-6 animate-fadeUp">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-leeds-border shadow-sm overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-leeds-border flex items-center justify-between bg-leeds-cream/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-leeds-blue flex items-center justify-center text-white font-bold shadow-sm">
              {initials || "?"}
            </div>
            <div>
              <h2 className="font-bold text-leeds-blue-dark">
                {match ? match.helperName : "Unknown Helper"}
              </h2>
              <p className="text-xs text-leeds-teal font-medium flex items-center gap-1">
                <span className="block w-1.5 h-1.5 rounded-full bg-leeds-teal animate-pulse" />
                Online
              </p>
            </div>
          </div>
          <button className="p-2 rounded-full hover:bg-leeds-border/50 text-gray-500">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
          </button>
        </div>

        {/* Chat Messages Placeholder */}
        <div className="flex-1 p-6 bg-leeds-cream/20 overflow-y-auto space-y-6">
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
            <div className="w-16 h-16 bg-leeds-blue/5 rounded-full flex items-center justify-center text-2xl">
              👋
            </div>
            <p className="text-sm text-gray-500 max-w-xs">
              This is the start of your conversation with <span className="font-semibold text-leeds-blue-dark">{match?.helperName}</span>.
              Say hello and share your request details!
            </p>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-leeds-border">
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-full border border-leeds-border bg-gray-50 px-4 py-2.5 text-sm focus:border-leeds-teal focus:ring-2 focus:ring-leeds-teal/20 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="rounded-full bg-leeds-blue text-white px-5 py-2.5 text-sm font-bold shadow-sm hover:bg-leeds-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
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
                <span className="text-lg font-bold text-leeds-teal">{(match.score * 100).toFixed(0)}%</span>
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
        </div>
      </div>
    </div>
  );
}
