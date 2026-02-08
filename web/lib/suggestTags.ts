// web/lib/suggestTags.ts
import { AllowedTags, type AllowedTag } from "./tags";

export type SuggestTagsResult = {
  tags: AllowedTag[];
  source: "ai" | "heuristic";
};

const keywordRules: Array<{ test: RegExp; tags: AllowedTag[] }> = [
  { test: /\b(cv|resume)\b/i, tags: ["cv", "career"] },
  { test: /\binterview\b|\bmock interview\b/i, tags: ["interview", "career"] },
  { test: /\b(frontend|react|ui|ux|figma)\b/i, tags: ["frontend", "design"] },
  { test: /\bbackend|api|server\b/i, tags: ["backend", "coding"] },
  { test: /\b(database|sql|postgres|mongodb)\b/i, tags: ["database", "backend"] },
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

function normaliseAllowedTags(input: unknown, max = 3): AllowedTag[] {
  const arr = Array.isArray(input) ? input : [];
  const filtered = arr.filter((t): t is AllowedTag => AllowedTags.includes(t as AllowedTag));
  // unique, preserve order
  const uniq: AllowedTag[] = [];
  for (const t of filtered) {
    if (!uniq.includes(t)) uniq.push(t);
    if (uniq.length >= max) break;
  }
  return uniq;
}

export function suggestTagsHeuristic(text: string, max = 3): AllowedTag[] {
  const selected = new Set<AllowedTag>();

  for (const rule of keywordRules) {
    if (rule.test.test(text)) {
      for (const t of rule.tags) selected.add(t);
    }
  }

  for (const t of fallbackTags) {
    if (selected.size >= 2) break;
    selected.add(t);
  }

  // Ensure at least 2 tags if possible
  for (const t of AllowedTags) {
    if (selected.size >= 2) break;
    selected.add(t);
  }

  return Array.from(selected).slice(0, max);
}

/**
 * Tries AI endpoint first; falls back to heuristic.
 * This will NOT throw — it always returns tags.
 */
export async function suggestTagsSmart(description: string, max = 3): Promise<SuggestTagsResult> {
  const text = (description ?? "").trim();
  if (!text) return { tags: [], source: "heuristic" };

  // 1) Try AI (Dev D)
  try {
    const res = await fetch("/api/ai/suggest-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, maxTags: max }),
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();

      // support multiple possible shapes:
      // { tags: [...] } OR { ok:true, data:{ tags:[...] } } OR { data:[...] }
      const candidate =
        json?.tags ??
        json?.data?.tags ??
        json?.data ??
        json?.result?.tags;

      const tags = normaliseAllowedTags(candidate, max);
      if (tags.length) return { tags, source: "ai" };
    }
  } catch {
    // ignore and fallback
  }

  // 2) Fallback heuristic
  return { tags: suggestTagsHeuristic(text, max), source: "heuristic" };
}
