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

const keywordRules: Array<{ test: RegExp; tags: AllowedTag[] }> = [
  { test: /\b(cv|resume)\b/i, tags: ["cv", "career"] },
  { test: /\binterview\b|\bmock interview\b/i, tags: ["interview", "career"] },
  { test: /\b(frontend|react|ui|ux|figma)\b/i, tags: ["frontend", "design"] },
  { test: /\bbackend|api|server\b/i, tags: ["backend", "coding"] },
  { test: /\b(database|sql|postgres)\b/i, tags: ["database", "backend"] },
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
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Request
        </p>
        <h1 className="text-3xl font-semibold">New Request</h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Share the details of what you need. We will match you with helpers
          once the request is submitted.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Description
              <textarea
                value={draft.description}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Describe what you need help with..."
                rows={6}
                className="mt-2 w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Format
                <select
                  value={draft.format}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      format: event.target.value as RequestFormat,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                >
                  {formatOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Urgency
                <select
                  value={draft.urgency}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      urgency: event.target.value as RequestUrgency,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                >
                  {urgencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Tags
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSuggestTags}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-600"
                >
                  Suggest tags
                </button>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {draft.tags.length} selected
                </p>
              </div>
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
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {tagMessage && (
              <p className="text-xs text-emerald-600 dark:text-emerald-300">
                {tagMessage}
              </p>
            )}

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Use tags to help the matching engine find the best helpers.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus:ring-zinc-700 dark:disabled:bg-zinc-600"
          >
            {isSubmitting ? "Creating..." : "Create request"}
          </button>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            We will take you to your matches after submission.
          </p>
          {errorMessage && (
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
              {errorMessage}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
