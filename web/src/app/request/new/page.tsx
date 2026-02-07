"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createRequest } from "../../../../lib/api";
import { AllowedTags, type AllowedTag } from "../../../../lib/tags";
import { useRequireAuth } from "@/hooks/useRequireAuth";

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

const keywordRules: Array<{ test: RegExp; tags: AllowedTag[] }> = [
  { test: /\b(cv|resume)\b/i, tags: ["cv", "career"] },
  { test: /\binterview\b|\bmock interview\b/i, tags: ["interview", "career"] },
  { test: /\b(frontend|react|ui|ux|figma)\b/i, tags: ["frontend", "design"] },
  { test: /\bbackend|api|server\b/i, tags: ["backend", "coding"] },
  { test: /\bdatabase|sql|postgres\b/i, tags: ["database", "backend"] },
  { test: /\bdesign|brand|visual\b/i, tags: ["design"] },
  { test: /\bwriting|copy|docs\b/i, tags: ["writing"] },
  { test: /\bmarketing|pitch|growth\b/i, tags: ["marketing"] },
  { test: /\bfinance|budget|pricing\b/i, tags: ["finance"] },
  { test: /\blegal|terms|privacy\b/i, tags: ["legal"] },
  { test: /\bhealth|wellbeing\b/i, tags: ["health"] },
  { test: /\badmin|ops|operations\b/i, tags: ["admin"] },
  { test: /\bcode|bug|debug\b/i, tags: ["coding"] },
];

const fallbackTags: AllowedTag[] = ["career", "coding", "design"];

const buildTitle = (description: string) => {
  const normalized = description.trim().replace(/\s+/g, " ");
  if (!normalized) return "New help request";
  const words = normalized.split(" ");
  const snippet = words.slice(0, 6).join(" ");
  return words.length > 6 ? `${snippet}...` : snippet;
};

const suggestTags = (description: string) => {
  const selected = new Set<AllowedTag>();
  keywordRules.forEach((rule) => {
    if (rule.test.test(description)) {
      rule.tags.forEach((tag) => selected.add(tag));
    }
  });

  fallbackTags.forEach((tag) => {
    if (selected.size < 2) {
      selected.add(tag);
    }
  });

  if (selected.size < 2) {
    AllowedTags.forEach((tag) => {
      if (selected.size < 2) {
        selected.add(tag);
      }
    });
  }

  return Array.from(selected).slice(0, 3);
};

export default function NewRequestPage() {
  const session = useRequireAuth();
  const router = useRouter();
  const [draft, setDraft] = useState<RequestDraft>(emptyDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagMessage, setTagMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const tagSet = useMemo(() => new Set(draft.tags), [draft.tags]);

  if (!session) return null;

  const toggleTag = (tag: AllowedTag) => {
    setDraft((prev) => {
      const nextTags = new Set(prev.tags);
      if (nextTags.has(tag)) {
        nextTags.delete(tag);
      } else {
        nextTags.add(tag);
      }
      return { ...prev, tags: Array.from(nextTags) };
    });
  };

  const handleSuggestTags = () => {
    const suggestions = suggestTags(draft.description);
    setDraft((prev) => ({ ...prev, tags: suggestions }));
    setTagMessage("Suggested tags applied.");
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

    if (!draft.description.trim()) {
      setErrorMessage("Add a short description to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createRequest({
        requesterId: session.userId,
        title: buildTitle(draft.description),
        description: draft.description.trim(),
        urgency: draft.urgency,
        format: draft.format,
        tags: draft.tags,
      });
      router.push(`/matches/${created.id}`);
    } catch (error) {
      setIsSubmitting(false);
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    }
  };

  const canSubmit = draft.description.trim().length > 0 && !isSubmitting;

  return (
    <div className="space-y-8 animate-fadeUp">
      <div className="text-center sm:text-left space-y-2">
        <h1 className="text-3xl font-bold text-leeds-blue tracking-tight">New Request</h1>
        <p className="text-leeds-blue-dark/70">
          Find the right person to help you with your project or career.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-leeds-border overflow-hidden">
            <div className="p-6 sm:p-8 space-y-8">
              {/* Description Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <label htmlFor="description" className="block text-sm font-semibold text-leeds-blue-dark">
                    How can we help?
                  </label>
                  <span className="text-xs text-leeds-blue-dark/50">
                    {draft.description.length} chars
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    id="description"
                    value={draft.description}
                    onChange={(e) => setDraft(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your challenge..."
                    rows={6}
                    className="w-full resize-none rounded-xl border border-leeds-border bg-leeds-cream/30 px-4 py-3 text-leeds-blue-dark placeholder:text-gray-400 focus:border-leeds-teal focus:ring-2 focus:ring-leeds-teal/20 transition-all outline-none"
                  />
                </div>

                {/* Quick Prompts */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-leeds-blue-dark/60 uppercase tracking-wider">Quick Starts</p>
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt.label}
                        type="button"
                        onClick={() => handleQuickPrompt(prompt.value)}
                        className="text-xs px-3 py-1.5 rounded-full border border-leeds-border hover:border-leeds-teal hover:text-leeds-teal transition-colors bg-white text-leeds-blue-dark/80"
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Format & Urgency */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-leeds-blue-dark">Format</label>
                  <select
                    value={draft.format}
                    onChange={(e) => setDraft(prev => ({ ...prev, format: e.target.value as RequestFormat }))}
                    className="w-full rounded-xl border border-leeds-border bg-leeds-cream/30 px-4 py-2.5 text-leeds-blue-dark focus:border-leeds-teal focus:ring-2 focus:ring-leeds-teal/20 transition-all outline-none"
                  >
                    {formatOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-leeds-blue-dark">Urgency</label>
                  <select
                    value={draft.urgency}
                    onChange={(e) => setDraft(prev => ({ ...prev, urgency: e.target.value as RequestUrgency }))}
                    className="w-full rounded-xl border border-leeds-border bg-leeds-cream/30 px-4 py-2.5 text-leeds-blue-dark focus:border-leeds-teal focus:ring-2 focus:ring-leeds-teal/20 transition-all outline-none"
                  >
                    {urgencyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-leeds-blue-dark">Tags</label>
                  <button
                    type="button"
                    onClick={handleSuggestTags}
                    className="text-xs text-leeds-teal font-medium hover:underline"
                  >
                    Suggest tags based on description
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AllowedTags.map((tag) => {
                    const selected = tagSet.has(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 border ${selected
                            ? "border-leeds-teal bg-leeds-teal text-white shadow-sm"
                            : "border-leeds-border bg-white text-leeds-blue-dark/70 hover:border-leeds-teal/50"
                          }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                {tagMessage && <p className="text-xs text-leeds-teal font-medium">{tagMessage}</p>}
              </div>

            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-leeds-blue/5 border-t border-leeds-border flex justify-end items-center gap-4">
              {errorMessage && <span className="text-sm text-red-600 font-medium">{errorMessage}</span>}
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-full bg-leeds-blue text-white px-6 py-2.5 text-sm font-bold shadow-lg shadow-leeds-blue/20 hover:bg-leeds-blue-dark hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Request"}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar / Info */}
        <div className="space-y-6">
          <div className="bg-leeds-blue/90 text-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold mb-2">Why request help?</h3>
            <ul className="space-y-4 text-sm text-white/80">
              <li className="flex gap-3">
                <span className="bg-leeds-teal/20 p-1 rounded text-leeds-teal">🚀</span>
                <span>Fast-track your learning by getting unblocked.</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-leeds-teal/20 p-1 rounded text-leeds-teal">🤝</span>
                <span>Meet new peers and potential collaborators.</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-leeds-teal/20 p-1 rounded text-leeds-teal">💡</span>
                <span>Get fresh perspectives on your ideas.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-leeds-border shadow-sm">
            <h3 className="text-sm font-bold text-leeds-blue-dark mb-3">Live Preview</h3>
            <div className="bg-leeds-cream rounded-xl p-4 border border-leeds-border">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-leeds-teal/20 flex items-center justify-center text-xs font-bold text-leeds-teal">
                  You
                </div>
                <div>
                  <p className="text-xs font-bold text-leeds-blue mb-0.5">Your Request</p>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
              </div>
              <p className="text-sm text-leeds-blue-dark line-clamp-3">
                {draft.description || "Your description will appear here..."}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {draft.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 bg-white rounded border border-leeds-border text-gray-600">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
