"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createRequest } from "../../../../lib/api";
import { AllowedTags, type AllowedTag } from "../../../../lib/tags";

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

const valueProps = [
  {
    title: "Fast matching",
    description: "Smart tags connect you to the right helper quickly.",
    accent:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      >
        <path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.9-5.3-2.8-5.3 2.8 1-5.9-4.2-4.1 5.9-.9L12 3z" />
      </svg>
    ),
  },
  {
    title: "Flexible formats",
    description: "Choose chat, call, or async review based on your schedule.",
    accent:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 12l9 4 9-4" />
        <path d="M3 17l9 4 9-4" />
      </svg>
    ),
  },
  {
    title: "Clear next steps",
    description: "Leave with actionable feedback and a plan of attack.",
    accent: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    ),
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
  const previewTitle = useMemo(
    () => buildTitle(draft.description),
    [draft.description]
  );
  const previewDescription = draft.description.trim()
    ? draft.description.trim()
    : "Add a short description to generate a preview.";
  const previewFormat =
    formatOptions.find((option) => option.value === draft.format)?.label ??
    "Chat";
  const previewUrgency =
    urgencyOptions.find((option) => option.value === draft.urgency)?.label ??
    "Medium";
  const descriptionLength = draft.description.trim().length;

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
        requesterId: "user_local",
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
    <section className="space-y-10 font-sans">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/80 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/60 sm:p-10">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-gradient-to-br from-amber-200/70 via-amber-100/30 to-sky-200/60 blur-3xl dark:from-amber-500/20 dark:via-amber-500/10 dark:to-sky-500/20 animate-[floatSlow_16s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-gradient-to-tr from-teal-200/60 via-emerald-100/30 to-lime-200/40 blur-3xl dark:from-teal-500/20 dark:via-emerald-500/10 dark:to-lime-500/20 animate-[floatSlow_18s_ease-in-out_infinite]" />
        <div className="relative grid gap-10 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="space-y-6 animate-[fadeUp_0.6s_ease-out_both]">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-500 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-300">
              Request
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                Create a focused request for expert help.
              </h1>
              <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300 sm:text-base">
                Share the goal, your current progress, and when you need
                feedback. We will match you with helpers who are ready to jump
                in.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {valueProps.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-zinc-200/70 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-900/70"
                >
                  <div
                    className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full ${item.accent}`}
                  >
                    {item.icon}
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-zinc-200/80 bg-white/90 p-6 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.65)] backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-900/80 animate-[fadeUp_0.7s_ease-out_both]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Live preview
              </p>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                Live
              </span>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {previewTitle}
                </p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {previewDescription}
                </p>
              </div>
              <div className="grid gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                <div className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800/70 dark:bg-zinc-900/70">
                  <span>Format</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {previewFormat}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800/70 dark:bg-zinc-900/70">
                  <span>Urgency</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {previewUrgency}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  Tags
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {draft.tags.length ? (
                    draft.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-zinc-200/80 bg-white px-3 py-1 text-xs font-medium capitalize text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Add at least 2 tags to boost matching.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-zinc-200/80 bg-white/80 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)] backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/60 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <label
                      htmlFor="request-description"
                      className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                    >
                      Description
                    </label>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Share your goal, context, and any deadline.
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {descriptionLength} chars
                  </span>
                </div>
                <textarea
                  id="request-description"
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Describe what you need help with..."
                  rows={7}
                  className="mt-4 w-full resize-none rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200/60 dark:border-zinc-800/80 dark:bg-zinc-950/60 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800/60"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Tip: Mention links or tools you want reviewed.</span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                    Auto-tagging
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  Quick starts
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt.label}
                      type="button"
                      onClick={() => handleQuickPrompt(prompt.value)}
                      className="rounded-full border border-zinc-200/80 bg-white/80 px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:border-zinc-600"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Tap a starter to insert it into the description.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60">
                  <label
                    htmlFor="request-format"
                    className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    Format
                  </label>
                  <select
                    id="request-format"
                    value={draft.format}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        format: event.target.value as RequestFormat,
                      }))
                    }
                    className="mt-3 w-full rounded-xl border border-zinc-200/80 bg-white/80 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200/60 dark:border-zinc-800/80 dark:bg-zinc-950/60 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800/60"
                  >
                    {formatOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60">
                  <label
                    htmlFor="request-urgency"
                    className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    Urgency
                  </label>
                  <select
                    id="request-urgency"
                    value={draft.urgency}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        urgency: event.target.value as RequestUrgency,
                      }))
                    }
                    className="mt-3 w-full rounded-xl border border-zinc-200/80 bg-white/80 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200/60 dark:border-zinc-800/80 dark:bg-zinc-950/60 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800/60"
                  >
                    {urgencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60">
                <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-gradient-to-br from-amber-200/60 via-orange-100/40 to-transparent blur-2xl dark:from-amber-500/20 dark:via-orange-500/10" />
                <div className="relative space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Tags
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Pick 2-3 tags for better matching.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSuggestTags}
                      className="rounded-full border border-zinc-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:border-zinc-600"
                    >
                      Suggest tags
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
                          className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
                            selected
                              ? "border-zinc-900 bg-zinc-900 text-white shadow-sm shadow-zinc-900/20 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                              : "border-zinc-200/80 bg-white/80 text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-950/40 dark:text-zinc-300 dark:hover:border-zinc-600"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  {tagMessage && (
                    <p
                      className="text-xs font-medium text-emerald-600 dark:text-emerald-300"
                      aria-live="polite"
                    >
                      {tagMessage}
                    </p>
                  )}

                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Use tags to help the matching engine find the best helpers.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  What happens next
                </p>
                <div className="mt-3 space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    We analyze your description and tags.
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Helpers respond with availability.
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                    Pick a match and start collaborating.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/60">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus:ring-zinc-700 dark:disabled:bg-zinc-600"
            >
              {isSubmitting ? "Creating..." : "Create request"}
            </button>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              We will take you to your matches after submission.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
            <span className="rounded-full border border-zinc-200/80 bg-white/80 px-3 py-1 dark:border-zinc-800/80 dark:bg-zinc-950/40">
              Format: {previewFormat}
            </span>
            <span className="rounded-full border border-zinc-200/80 bg-white/80 px-3 py-1 dark:border-zinc-800/80 dark:bg-zinc-950/40">
              Urgency: {previewUrgency}
            </span>
            <span className="rounded-full border border-zinc-200/80 bg-white/80 px-3 py-1 dark:border-zinc-800/80 dark:bg-zinc-950/40">
              {draft.tags.length} tags selected
            </span>
          </div>
          {errorMessage && (
            <div
              className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-200"
              aria-live="polite"
            >
              {errorMessage}
            </div>
          )}
        </div>
      </form>
    </section>
  );
}
