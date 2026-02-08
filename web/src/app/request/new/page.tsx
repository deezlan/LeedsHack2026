"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createRequest } from "../../../../lib/api";
import { AllowedTags, type AllowedTag } from "../../../../lib/tags";
import { useRequireAuth } from "@/src/hooks/useRequireAuth";
import { suggestTagsSmart } from "../../../../lib/suggestTags";
import VoiceLoop from "@/src/components/VoiceLoop";

type RequestFormat = "chat" | "call" | "async";
type RequestUrgency = "low" | "medium" | "high";

type RequestDraft = {
  description: string;
  format: RequestFormat;
  urgency: RequestUrgency;
  tags: AllowedTag[];
};

const emptyDraft: RequestDraft = {
  description: "",
  format: "chat",
  urgency: "medium",
  tags: [],
};

const formatOptions: { value: RequestFormat; label: string }[] = [
  { value: "chat", label: "Chat (15-20 min)" },
  { value: "call", label: "Call (30 min)" },
  { value: "async", label: "Async review" },
];

const urgencyOptions: { value: RequestUrgency; label: string }[] = [
  { value: "low", label: "Low (this week)" },
  { value: "medium", label: "Medium (next 48 hrs)" },
  { value: "high", label: "High (today)" },
];

const quickPrompts = [
  {
    label: "Portfolio feedback",
    value:
      "I need feedback on my portfolio and personal site. Focus on structure, clarity, and what to highlight.",
  },
  {
    label: "Interview prep",
    value:
      "I have a tech interview coming up. I would like a mock interview and feedback on my answers.",
  },
  {
    label: "Product pitch",
    value:
      "Help me refine a pitch deck for a startup demo. I need sharper messaging and a clear narrative.",
  },
  {
    label: "Bug diagnosis",
    value:
      "I am stuck on a bug in my app and need help isolating the root cause and next steps.",
  },
];

// Small local fallback if AI helper fails / no description
const keywordRules: Array<{ test: RegExp; tags: AllowedTag[] }> = [
  { test: /\b(cv|resume|cover letter|linkedin)\b/i, tags: ["cv", "career"] },
  { test: /\binterview\b|\bmock interview\b/i, tags: ["interview", "career"] },
  { test: /\b(frontend|react|ui|ux|figma|css)\b/i, tags: ["frontend", "design"] },
  { test: /\bbackend|api|server|node|express\b/i, tags: ["backend", "coding"] },
  { test: /\b(database|sql|postgres|mysql|mongodb|schema)\b/i, tags: ["database", "backend"] },
  { test: /\bdesign|brand|visual|prototype|wireframe\b/i, tags: ["design"] },
  { test: /\bwriting|copy|docs|documentation|essay\b/i, tags: ["writing"] },
  { test: /\bmarketing|pitch|growth|seo|campaign\b/i, tags: ["marketing"] },
  { test: /\bfinance|budget|pricing|revenue|cost|funding\b/i, tags: ["finance"] },
  { test: /\blegal|terms|privacy|gdpr|compliance|contract\b/i, tags: ["legal"] },
  { test: /\bhealth|wellbeing|stress|burnout\b/i, tags: ["health"] },
  { test: /\badmin|ops|operations|planning|logistics|timeline\b/i, tags: ["admin"] },
  { test: /\bcode|bug|debug|algorithm|leetcode\b/i, tags: ["coding"] },
];

const fallbackTags: AllowedTag[] = ["career", "coding", "design"];

const buildTitle = (description: string) => {
  const normalized = description.trim().replace(/\s+/g, " ");
  if (!normalized) return "New help request";
  const words = normalized.split(" ");
  const snippet = words.slice(0, 6).join(" ");
  return words.length > 6 ? `${snippet}...` : snippet;
};

function fallbackSuggestTags(description: string, max = 3): AllowedTag[] {
  const selected = new Set<AllowedTag>();
  for (const rule of keywordRules) {
    if (rule.test.test(description)) rule.tags.forEach((t) => selected.add(t));
  }
  for (const t of fallbackTags) if (selected.size < 2) selected.add(t);
  if (selected.size < 2) {
    for (const t of AllowedTags) if (selected.size < 2) selected.add(t);
  }
  return Array.from(selected).slice(0, max);
}

// --- Speech scaffolding (kept, but harmless if not used) ---
type SpeechRecognitionResultLike = { isFinal: boolean; 0: { transcript: string } };
type SpeechRecognitionEventLike = { resultIndex: number; results: ArrayLike<SpeechRecognitionResultLike> };
type SpeechRecognitionErrorEventLike = { error?: string };

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructorLike = new () => SpeechRecognitionLike;
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructorLike;
  webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
};

const getSpeechErrorMessage = (errorCode?: string) => {
  switch (errorCode) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission was denied. Please allow access and try again.";
    case "audio-capture":
      return "No microphone was detected. Please connect one and try again.";
    case "no-speech":
      return "No speech detected. Please try speaking more clearly.";
    case "network":
      return "Speech recognition connection failed. Please try again.";
    default:
      return "Speech input stopped due to an error. Please try again.";
  }
};

export default function NewRequestPage() {
  const session = useRequireAuth();
  const router = useRouter();

  const [draft, setDraft] = useState<RequestDraft>(emptyDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);

  const [tagMessage, setTagMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Optional speech UX states
  const [isListening, setIsListening] = useState(false);
  const [speechMessage, setSpeechMessage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechBaseDescriptionRef = useRef("");
  const finalTranscriptRef = useRef("");

  const speechRecognitionCtor = useMemo<SpeechRecognitionConstructorLike | null>(() => {
    if (typeof window === "undefined") return null;
    const w = window as SpeechWindow;
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  }, []);

  const isSpeechSupported = speechRecognitionCtor !== null;

  useEffect(() => {
    if (!tagMessage) return;
    const timer = window.setTimeout(() => setTagMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [tagMessage]);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = window.setTimeout(() => setErrorMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [errorMessage]);

  useEffect(() => {
    if (!speechMessage) return;
    const timer = window.setTimeout(() => setSpeechMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [speechMessage]);

  useEffect(() => {
    if (!speechRecognitionCtor) return;

    const recognition = new speechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscriptRef.current = `${finalTranscriptRef.current}${transcript}`;
        } else {
          interimTranscript += transcript;
        }
      }

      const combined = `${finalTranscriptRef.current}${interimTranscript}`.trim();
      if (!combined) return;

      setDraft((prev) => {
        const base = speechBaseDescriptionRef.current.trimEnd();
        const next = base ? `${base} ${combined}` : combined;
        if (prev.description === next) return prev;
        return { ...prev, description: next };
      });
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setSpeechMessage(getSpeechErrorMessage(event.error));
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {}
      recognitionRef.current = null;
    };
  }, [speechRecognitionCtor]);

  const tagSet = useMemo(() => new Set(draft.tags), [draft.tags]);

  if (!session) return null;

  const toggleTag = (tag: AllowedTag) => {
    setDraft((prev) => {
      const nextTags = new Set(prev.tags);
      if (nextTags.has(tag)) nextTags.delete(tag);
      else nextTags.add(tag);
      return { ...prev, tags: Array.from(nextTags) };
    });
  };

  const handleSuggestTags = async () => {
    const desc = draft.description.trim();
    if (!desc) {
      setTagMessage("Write a description first so we can suggest tags.");
      return;
    }

    setIsSuggestingTags(true);
    try {
      const { tags, source } = await suggestTagsSmart(desc, 3);
      const safeTags = Array.isArray(tags)
        ? tags.filter((t): t is AllowedTag => AllowedTags.includes(t as any))
        : [];

      if (safeTags.length) {
        setDraft((prev) => ({ ...prev, tags: safeTags }));
        setTagMessage(source === "ai" ? "AI suggestions applied." : "Suggestions applied (fallback).");
      } else {
        const fallback = fallbackSuggestTags(desc, 3);
        setDraft((prev) => ({ ...prev, tags: fallback }));
        setTagMessage("Suggestions applied (fallback).");
      }
    } catch {
      const fallback = fallbackSuggestTags(desc, 3);
      setDraft((prev) => ({ ...prev, tags: fallback }));
      setTagMessage("Suggestions applied (fallback).");
    } finally {
      setIsSuggestingTags(false);
    }
  };

  const handleQuickPrompt = (value: string) => {
    setDraft((prev) => {
      const trimmed = prev.description.trim();
      const nextDescription = trimmed ? `${trimmed}\n${value}` : value;
      return { ...prev, description: nextDescription };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    // stop speech if currently listening
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsListening(false);

    if (!draft.description.trim()) {
      setErrorMessage("Add a short description to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createRequest({
        requesterId: session.userId, // IMPORTANT: use auth user id to match DB ObjectId
        title: buildTitle(draft.description),
        description: draft.description.trim(),
        urgency: draft.urgency,
        format: draft.format,
        tags: draft.tags,
      });

      router.push(`/matches/${created.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = draft.description.trim().length > 0 && !isSubmitting;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-leeds-teal/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-leeds-bright/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-leeds-blue/10 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center sm:text-left space-y-2 mb-8 animate-fadeUp">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-leeds-blue/5 border border-leeds-blue/10 text-xs font-bold text-leeds-blue mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-leeds-teal animate-pulse" />
            New Request
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-leeds-blue-dark tracking-tight">
            What are you working on?
          </h1>
          <p className="text-lg text-leeds-blue-dark/60 max-w-2xl">
            Describe your challenge to find the perfect collaborator or mentor.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Main Form */}
          <div className="lg:col-span-7 space-y-6 animate-fadeUp" style={{ animationDelay: "100ms" }}>
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-[2rem] shadow-xl border border-leeds-border overflow-hidden relative group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-leeds-teal via-leeds-bright to-leeds-teal opacity-50" />

              <div className="p-6 sm:p-10 space-y-10">
                {/* Description */}
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <label htmlFor="description" className="block text-lg font-bold text-leeds-blue-dark">
                      Describe your challenge
                    </label>
                    <span className={`text-xs font-mono transition-colors ${draft.description.length > 0 ? "text-leeds-teal" : "text-gray-400"}`}>
                      {draft.description.length} chars
                    </span>
                  </div>

                  <div className="relative group/input">
                    <textarea
                      id="description"
                      value={draft.description}
                      onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="I'm looking for help with..."
                      rows={6}
                      className="w-full resize-none rounded-2xl border-2 border-transparent bg-white shadow-inner px-6 py-5 pr-16 text-lg text-leeds-blue-dark placeholder:text-gray-300 focus:border-leeds-teal focus:ring-4 focus:ring-leeds-teal/10 transition-all outline-none"
                    />
                    <div className="w-full">
                      <VoiceLoop />
                    </div>
                    <div className="absolute bottom-4 right-4 text-gray-300 text-[10px] pointer-events-none opacity-0 group-focus-within/input:opacity-100 transition-opacity">
                      Markdown supported
                    </div>
                  </div>

                  <div className="min-h-[1.25rem]" aria-live="polite">
                    {isListening && <p className="text-sm text-leeds-teal font-semibold">Listening...</p>}
                    {!isSpeechSupported && <p className="text-xs text-gray-500">Speech input not supported</p>}
                    {speechMessage && <p className="text-xs text-red-500">{speechMessage}</p>}
                  </div>

                  {/* Quick Prompts */}
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Quick Starts</p>
                    <div className="flex flex-wrap gap-3">
                      {quickPrompts.map((prompt, i) => (
                        <button
                          key={prompt.label}
                          type="button"
                          onClick={() => handleQuickPrompt(prompt.value)}
                          className="group relative flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-leeds-border/50 hover:border-leeds-teal hover:shadow-md transition-all hover:-translate-y-0.5"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          <span className="text-sm font-medium text-leeds-blue-dark/80 group-hover:text-leeds-teal transition-colors">
                            {prompt.label}
                          </span>
                          <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity text-leeds-teal">
                            →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-leeds-border to-transparent" />

                {/* Format & Urgency */}
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-leeds-blue-dark uppercase tracking-wide">Format</label>
                    <div className="relative">
                      <select
                        value={draft.format}
                        onChange={(e) => setDraft((prev) => ({ ...prev, format: e.target.value as RequestFormat }))}
                        className="w-full appearance-none rounded-xl border border-leeds-border bg-white px-5 py-4 text-leeds-blue-dark font-medium cursor-pointer hover:border-leeds-teal focus:border-leeds-teal focus:ring-4 focus:ring-leeds-teal/10 transition-all outline-none shadow-sm"
                      >
                        {formatOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-leeds-blue-dark uppercase tracking-wide">Urgency</label>
                    <div className="relative">
                      <select
                        value={draft.urgency}
                        onChange={(e) => setDraft((prev) => ({ ...prev, urgency: e.target.value as RequestUrgency }))}
                        className="w-full appearance-none rounded-xl border border-leeds-border bg-white px-5 py-4 text-leeds-blue-dark font-medium cursor-pointer hover:border-leeds-teal focus:border-leeds-teal focus:ring-4 focus:ring-leeds-teal/10 transition-all outline-none shadow-sm"
                      >
                        {urgencyOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-leeds-blue-dark uppercase tracking-wide">Tags</label>
                    <button
                      type="button"
                      onClick={handleSuggestTags}
                      disabled={isSuggestingTags}
                      className="text-xs flex items-center gap-1.5 text-leeds-teal font-bold hover:bg-leeds-teal/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSuggestingTags ? "Suggesting..." : "Suggest tags"}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {AllowedTags.map((tag) => {
                      const selected = tagSet.has(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 border ${
                            selected
                              ? "border-leeds-teal bg-leeds-teal text-white shadow-sm"
                              : "border-leeds-border bg-white text-leeds-blue-dark/70 hover:border-leeds-teal/50"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  {tagMessage && (
                    <div className="text-sm text-leeds-teal font-medium flex items-center gap-2 animate-pulse">
                      <span>✓</span> {tagMessage}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-10 py-6 bg-gray-50 border-t border-leeds-border flex justify-between items-center">
                <p className="text-xs text-gray-400 font-medium">Request will be visible to active students</p>
                <div className="flex items-center gap-4">
                  {errorMessage && (
                    <span className="text-sm text-red-500 font-bold bg-red-50 px-3 py-1 rounded-lg">
                      {errorMessage}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="group relative overflow-hidden rounded-full bg-leeds-blue text-white px-8 py-3.5 text-sm font-bold shadow-xl shadow-leeds-blue/30 hover:shadow-2xl hover:shadow-leeds-blue/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isSubmitting ? "Creating..." : "Create Request"}
                      {!isSubmitting && <span className="group-hover:translate-x-1 transition-transform">→</span>}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-leeds-teal to-leeds-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-5 space-y-8 sticky top-8 animate-fadeUp" style={{ animationDelay: "200ms" }}>
            <div className="bg-white rounded-3xl p-6 border border-leeds-border shadow-2xl shadow-leeds-blue/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-leeds-teal/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Preview
              </h3>

              <div className="bg-leeds-cream rounded-2xl p-5 border border-leeds-border transition-all duration-300">
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-leeds-teal to-leeds-blue flex items-center justify-center text-sm font-bold text-white shadow-md">
                    You
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <p className="text-sm font-bold text-leeds-blue-dark">Your Request</p>
                      <span className="text-[10px] text-gray-400">Just now</span>
                    </div>
                    <div
                      className={`text-base text-leeds-blue-dark leading-relaxed break-words min-h-[60px] ${
                        draft.description ? "" : "text-gray-400 italic"
                      }`}
                    >
                      {draft.description || "Start typing to preview your request..."}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4 ml-14">
                  {draft.tags.length > 0 ? (
                    draft.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] uppercase font-bold px-2.5 py-1 bg-white rounded-md border border-leeds-border text-gray-600 shadow-sm"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] px-2 py-1 bg-transparent border border-dashed border-gray-300 rounded text-gray-400">
                      No tags
                    </span>
                  )}
                  {draft.tags.length > 3 && (
                    <span className="text-[10px] px-2 py-1 text-gray-400">
                      +{draft.tags.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-leeds-blue-dark text-white p-8 rounded-3xl shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-leeds-teal/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl pointer-events-none" />
              <h3 className="text-xl font-bold mb-6 relative z-10">Why request help?</h3>
              <ul className="space-y-5 text-sm text-white/90 relative z-10">
                <li className="flex gap-4 items-center">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shadow-inner">
                    🚀
                  </div>
                  <span>Fast-track your learning by getting unblocked.</span>
                </li>
                <li className="flex gap-4 items-center">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shadow-inner">
                    🤝
                  </div>
                  <span>Meet new peers and potential collaborators.</span>
                </li>
                <li className="flex gap-4 items-center">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shadow-inner">
                    💡
                  </div>
                  <span>Get fresh perspectives on your ideas.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
