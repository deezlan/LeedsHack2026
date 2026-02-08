// lib/matching.ts
import type { User, HelpRequest, Match, MatchState, Id } from "./types";

const TAG_SYNONYMS: Record<string, string[]> = {
  interview: ["cv", "writing"],
  coding: ["backend", "frontend"],
};

function expandTags(tags: readonly string[]) {
  const out = new Set(tags.map(norm));
  const snapshot = [...out];

  for (const t of snapshot) {
    const extra = TAG_SYNONYMS[t];
    if (extra) extra.forEach((e) => out.add(norm(e)));
  }
  return out;
}


type Ranked = {
  helper: User;
  score: number; // 0..1
  reasons: string[];
};

const WEIGHTS = {
  tags: 0.70,
  format: 0.20,
  urgency: 0.10,
} as const;

function norm(s: string) {
  return s.trim().toLowerCase();
}

function setOfTags(tags: readonly string[]) {
  return new Set(tags.map(norm));
}

function jaccard(a: Set<string>, b: Set<string>) {
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

function urgencyScore(u: HelpRequest["urgency"]) {
  // deterministic 0..1
  if (u === "high") return 1.0;
  if (u === "medium") return 0.6;
  return 0.3;
}

function formatScore(reqFormat: HelpRequest["format"], helper: User) {
  // You don't currently store helper formats. So:
  // - If later you add helper.formats, update this function.
  // - For now, return neutral 0.5 so format weight doesn't zero everyone out.
  return 0.5;
}

export function scoreCandidate(request: HelpRequest, requester: User, helper: User) {
  const reqTags = expandTags(request.tags);
  const helperTags = expandTags(helper.tags);


  const tagSim = jaccard(reqTags, helperTags); // 0..1
  const fmt = formatScore(request.format, helper); // 0..1 (neutral for now)
  const urg = urgencyScore(request.urgency); // 0..1

  const score =
    tagSim * WEIGHTS.tags +
    fmt * WEIGHTS.format +
    urg * WEIGHTS.urgency;

  // clamp to [0,1] with a stable float
  return Math.max(0, Math.min(1, Number(score.toFixed(4))));
}

export function buildReasons(request: HelpRequest, helper: User) {
  const reqExpanded = expandTags(request.tags);
  const helperExpanded = expandTags(helper.tags);

  // For display: prefer showing original tags that genuinely match,
  // otherwise fall back to showing which expanded ones matched.
  const reqOriginal = request.tags.map(norm);
  const helperOriginal = new Set(helper.tags.map(norm));

  const sharedOriginal = reqOriginal.filter((t) => helperOriginal.has(t)).slice(0, 4);

  const sharedExpanded = [...reqExpanded]
    .filter((t) => helperExpanded.has(t))
    .filter((t) => !sharedOriginal.includes(t))
    .slice(0, 2);

  const reasons: string[] = [];

  if (sharedOriginal.length) reasons.push(`Shared tags: ${sharedOriginal.join(", ")}`);
  if (!sharedOriginal.length && sharedExpanded.length) {
    reasons.push(`Related tags: ${sharedExpanded.join(", ")}`);
  }

  reasons.push(`Request format: ${request.format}`);

  if (request.urgency === "high") reasons.push("Urgent request");
  if (request.urgency === "medium") reasons.push("Time-sensitive request");

  if (reasons.length === 0) reasons.push("Profile appears generally relevant");

  return reasons.slice(0, 4);
}

export function rankTopN(params: {
  request: HelpRequest;
  requester: User;
  candidates: User[];
  n?: number;
}): Ranked[] {
  const { request, requester, candidates, n = 5 } = params;

  return candidates
    .filter((u) => u.id !== requester.id)
    .map((helper) => {
      const score = scoreCandidate(request, requester, helper);
      const reasons = buildReasons(request, helper);
      return { helper, score, reasons };
    })
    .sort((a, b) => b.score - a.score || a.helper.id.localeCompare(b.helper.id))
    .slice(0, n);
}

export function makeMatchId(requestId: Id, helperId: Id) {
  return `${requestId}__${helperId}`;
}

export function makeMatch(params: {
  id: Id;
  requestId: Id;
  requesterId: Id;
  helperId: Id;
  score: number; // 0..1
  reasons: string[];
  state: MatchState;
  nowIso?: string;
}): Match {
  const now = params.nowIso ?? new Date().toISOString();
  return {
    id: params.id,
    requestId: params.requestId,
    requesterId: params.requesterId,
    helperId: params.helperId,
    score: params.score,
    reasons: params.reasons,
    state: params.state,
    createdAt: now,
    updatedAt: now,
  };
}
