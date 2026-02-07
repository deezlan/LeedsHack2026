"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { mockMatches } from "../../../../lib/mock";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type ChatAttachment = {
  name: string;
  size: number;
  type: string;
};

type ChatMessage = {
  id: string;
  text: string;
  attachments?: ChatAttachment[];
  sender: "me" | "them";
  createdAt: string;
};

function isChatAttachment(value: unknown): value is ChatAttachment {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ChatAttachment>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.size === "number" &&
    typeof candidate.type === "string"
  );
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ChatMessage>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.text === "string" &&
    (candidate.attachments === undefined ||
      (Array.isArray(candidate.attachments) &&
        candidate.attachments.every(isChatAttachment))) &&
    (candidate.sender === "me" || candidate.sender === "them") &&
    typeof candidate.createdAt === "string"
  );
}

function formatAttachmentSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ConnectionPage() {
  const session = useRequireAuth();
  const params = useParams<{ matchId: string }>();
  const matchIdParam = params?.matchId ?? "";
  const matchId = Array.isArray(matchIdParam) ? matchIdParam[0] : matchIdParam;

  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);
  const [loadedFromStorage, setLoadedFromStorage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storageKey = useMemo(() => `chat:${matchId}`, [matchId]);

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    setLoadedFromStorage(false);
    setStorageWarning(null);

    if (!matchId) {
      setMessages([]);
      setLoadedFromStorage(true);
      return;
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setMessages([]);
      } else {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          setMessages([]);
        } else {
          setMessages(parsed.filter(isChatMessage));
        }
      }
    } catch {
      setMessages([]);
      setStorageWarning("Could not load older messages.");
    } finally {
      setLoadedFromStorage(true);
    }
  }, [matchId, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !loadedFromStorage) return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(messages));
      setStorageWarning(null);
    } catch {
      setStorageWarning("Message saved in chat, but not persisted locally.");
    }
  }, [loadedFromStorage, messages, storageKey]);

  const syncMessage = useCallback(
    async (nextMessage: ChatMessage) => {
      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId,
            text: nextMessage.text,
            attachments: nextMessage.attachments ?? [],
            createdAt: nextMessage.createdAt,
          }),
        });

        if (response.status === 404) return;
        if (!response.ok) throw new Error("Message sync failed");
      } catch {
        setSyncWarning("Message sent, but server sync failed.");
      }
    },
    [matchId]
  );

  const handleSend = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = message.trim();
      if (!trimmed && attachments.length === 0) return;

      const nextMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        text: trimmed,
        attachments: attachments.length > 0 ? attachments : undefined,
        sender: "me",
        createdAt: new Date().toISOString(),
      };

      setMessage("");
      setAttachments([]);
      setSyncWarning(null);
      setMessages((prev) => [...prev, nextMessage]);
      void syncMessage(nextMessage);
    },
    [attachments, message, syncMessage]
  );

  const handleSelectAttachments = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = event.target.files;
      if (!fileList || fileList.length === 0) return;

      const nextAttachments: ChatAttachment[] = Array.from(fileList).map(
        (file) => ({
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
        })
      );

      setAttachments((prev) => [...prev, ...nextAttachments]);
      event.target.value = "";
    },
    []
  );

  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }, []);

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

        {/* Chat Messages */}
        <div className="flex-1 p-6 bg-leeds-cream/20 overflow-y-auto space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
              <div className="w-16 h-16 bg-leeds-blue/5 rounded-full flex items-center justify-center text-2xl">
                👋
              </div>
              <p className="text-sm text-gray-500 max-w-xs">
                This is the start of your conversation with <span className="font-semibold text-leeds-blue-dark">{match?.helperName}</span>.
                Say hello and share your request details!
              </p>
            </div>
          ) : (
            messages.map((item) => (
              <div
                key={item.id}
                className={`flex ${item.sender === "me" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${item.sender === "me"
                    ? "bg-leeds-blue text-white"
                    : "bg-white border border-leeds-border text-leeds-blue-dark"
                    }`}
                >
                  {item.text && <p>{item.text}</p>}
                  {item.attachments && item.attachments.length > 0 && (
                    <div className={`${item.text ? "mt-2" : ""} space-y-1`}>
                      {item.attachments.map((attachment, index) => (
                        <div
                          key={`${attachment.name}-${attachment.size}-${index}`}
                          className={`rounded-lg px-2 py-1 text-xs ${item.sender === "me"
                            ? "bg-white/20 text-white"
                            : "bg-leeds-cream text-leeds-blue-dark"
                            }`}
                        >
                          <p className="truncate font-medium">{attachment.name}</p>
                          <p className="opacity-80">
                            {attachment.type} - {formatAttachmentSize(attachment.size)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-leeds-border">
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <div
                  key={`${attachment.name}-${attachment.size}-${index}`}
                  className="inline-flex items-center gap-2 rounded-full bg-leeds-cream px-3 py-1.5 text-xs text-leeds-blue-dark border border-leeds-border"
                >
                  <span className="max-w-[180px] truncate">{attachment.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="rounded-full w-4 h-4 inline-flex items-center justify-center bg-white text-gray-500 hover:text-red-600"
                    aria-label={`Remove ${attachment.name}`}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
          <form className="flex gap-2" onSubmit={handleSend}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleSelectAttachments}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-leeds-border px-3 py-2.5 text-sm text-leeds-blue hover:bg-leeds-cream transition-colors"
              aria-label="Attach file"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.44 11.05L12.25 20.24a6 6 0 0 1-8.49-8.49l9.2-9.19a4 4 0 0 1 5.65 5.65l-9.2 9.2a2 2 0 0 1-2.82-2.83l8.48-8.48" />
              </svg>
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-full border border-leeds-border bg-gray-50 px-4 py-2.5 text-sm focus:border-leeds-teal focus:ring-2 focus:ring-leeds-teal/20 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!message.trim() && attachments.length === 0}
              className="rounded-full bg-leeds-blue text-white px-5 py-2.5 text-sm font-bold shadow-sm hover:bg-leeds-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
          {(storageWarning || syncWarning) && (
            <p className="mt-2 text-xs text-amber-700">{storageWarning ?? syncWarning}</p>
          )}
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
