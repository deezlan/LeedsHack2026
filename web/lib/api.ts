import type { HelpRequest, Id, Match, User } from "./types";
import { mockInbox, mockMatches, type InboxItem, type MatchCard } from "./mock";

const USE_MOCKS =
  process.env.NEXT_PUBLIC_USE_MOCKS === undefined ||
  process.env.NEXT_PUBLIC_USE_MOCKS === "true";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const jsonHeaders = {
  "Content-Type": "application/json",
};

const nowIso = () => new Date().toISOString();

const makeId = (prefix: string): Id =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...jsonHeaders,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(
      `API request failed (${res.status}) ${path}${
        message ? `: ${message}` : ""
      }`
    );
  }

  return res.json() as Promise<T>;
}

export type CreateUserInput = Omit<User, "id" | "createdAt" | "updatedAt"> & {
  id?: Id;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateRequestInput = Omit<
  HelpRequest,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: Id;
  createdAt?: string;
  updatedAt?: string;
};

export type MatchDecision = "accepted" | "declined";

type CreateUserPayload = Omit<User, "createdAt" | "updatedAt">;
type CreateRequestPayload = Omit<HelpRequest, "id" | "createdAt" | "updatedAt">;
type RespondMatchPayload = {
  decision: MatchDecision;
  connectionPayload?: Match["connectionPayload"];
};

const toMatchCard = (match: Match): MatchCard => ({
  id: match.id,
  requestId: match.requestId,
  helperName: match.helperId,
  score: match.score,
  reasons: match.reasons,
  state: match.state,
});

const toInboxItem = (match: Match): InboxItem => {
  const status: InboxItem["status"] =
    match.state === "requested"
      ? "action-needed"
      : match.state === "accepted"
        ? "accepted"
        : match.state === "declined"
          ? "declined"
          : "read";

  return {
    matchId: match.id,
    requestId: match.requestId,
    fromUserName: match.requesterId, // later replace with name lookup
    preview:
      match.connectionPayload?.message ??
      match.connectionPayload?.nextStep ??
      "New match request.",
    status,
  };
};

export async function createUser(profile: CreateUserInput): Promise<User> {
  if (USE_MOCKS) {
    const timestamp = nowIso();
    return {
      ...profile,
      id: profile.id ?? makeId("user"),
      createdAt: profile.createdAt ?? timestamp,
      updatedAt: profile.updatedAt ?? timestamp,
    } as User;
  }

  if (!profile.id) {
    throw new Error("createUser requires an id when USE_MOCKS is false.");
  }

  const payload: CreateUserPayload = {
    id: profile.id,
    name: profile.name,
    bio: profile.bio,
    tags: profile.tags,
    timezone: profile.timezone,
  };

  const { user } = await apiFetch<{ user: User }>("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return user;
}

export async function createRequest(
  request: CreateRequestInput
): Promise<HelpRequest> {
  if (USE_MOCKS) {
    const timestamp = nowIso();
    return {
      ...request,
      id: request.id ?? makeId("req"),
      createdAt: request.createdAt ?? timestamp,
      updatedAt: request.updatedAt ?? timestamp,
    } as HelpRequest;
  }

  const payload: CreateRequestPayload = {
    requesterId: request.requesterId,
    title: request.title,
    description: request.description,
    urgency: request.urgency,
    format: request.format,
    tags: request.tags,
  };

  const { request: created } = await apiFetch<{ request: HelpRequest }>(
    "/api/requests",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  return created;
}

export async function generateMatches(
  requestId: Id,
  topN?: number
): Promise<MatchCard[]> {
  if (USE_MOCKS) {
    const filtered = mockMatches.filter(
      (match) => match.requestId === requestId
    );
    return filtered.length ? filtered : mockMatches;
  }

  const payload =
    topN === undefined ? { requestId } : { requestId, topN };

  const { matches } = await apiFetch<{ matches: Match[] }>(
    "/api/matches/generate",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  const res = await fetch("/api/debug/store", { cache: "no-store" });
  let nameMap: Record<string, string> = {};
  if (res.ok) {
    const data = await res.json();
    for (const u of data.users ?? []) nameMap[u.id] = u.name;
  }

  return matches.map((m) => ({
    ...toMatchCard(m),
    helperName: nameMap[m.helperId] ?? m.helperId,
  }));
}

export async function requestHelp(matchId: Id): Promise<MatchCard> {
  if (USE_MOCKS) {
    const match = mockMatches.find((item) => item.id === matchId);
    if (!match) {
      throw new Error(`Mock match not found: ${matchId}`);
    }
    return match;
  }

  const { match } = await apiFetch<{ match: Match }>(
    `/api/matches/${matchId}/request`,
    { method: "POST" }
  );

  return toMatchCard(match);
}

export async function respondToMatch(
  matchId: Id,
  decision: MatchDecision,
  connectionPayload?: Match["connectionPayload"]
): Promise<MatchCard> {
  if (USE_MOCKS) {
    const match = mockMatches.find((item) => item.id === matchId);
    if (!match) {
      throw new Error(`Mock match not found: ${matchId}`);
    }
    return match;
  }

  const payload: RespondMatchPayload =
    connectionPayload === undefined
      ? { decision }
      : { decision, connectionPayload };

  const { match } = await apiFetch<{ match: Match }>(
    `/api/matches/${matchId}/respond`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  return toMatchCard(match);
}

export async function getInbox(helperId: Id): Promise<InboxItem[]> {
  if (USE_MOCKS) {
    return mockInbox;
  }

  const { items } = await apiFetch<{ items: Match[] }>(
    `/api/inbox/${helperId}`,
    { method: "GET" }
  );

  const nameMap = await getUserNameMap();

  return items.map((m) => {
    const item = toInboxItem(m);
    return {
      ...item,
      fromUserName: nameMap[m.requesterId] ?? item.fromUserName,
    };
  });
}

async function getUserNameMap(): Promise<Record<string, string>> {
  const res = await fetch("/api/debug/store", { cache: "no-store" });
  if (!res.ok) return {};
  const data = await res.json();
  const map: Record<string, string> = {};
  for (const u of data.users ?? []) map[u.id] = u.name;
  return map;
}

export async function getMatch(matchId: Id): Promise<MatchCard> {
  if (USE_MOCKS) {
    const match = mockMatches.find((m) => m.id === matchId);
    if (!match) throw new Error(`Mock match not found: ${matchId}`);
    return match;
  }

  const match = await apiFetch<Match>(`/api/matches/${matchId}`, { method: "GET" });

  // optional: name map (same trick as generate)
  const nameMap = await getUserNameMap();

  return {
    ...toMatchCard(match),
    helperName: nameMap[match.helperId] ?? match.helperId,
  };
}
