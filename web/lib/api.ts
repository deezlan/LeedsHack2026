import type { HelpRequest, Id, Match, User } from "./types";
import { mockInbox, mockMatches, type InboxItem, type MatchCard } from "./mock";
import type { AuthSession } from "./auth";

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
});

const toInboxItem = (match: Match): InboxItem => ({
  matchId: match.id,
  requestId: match.requestId,
  // TODO: replace IDs with display names when user lookup is available.
  fromUserName: match.requesterId,
  preview:
    match.connectionPayload?.message ??
    match.connectionPayload?.nextStep ??
    "New match request.",
  status: match.state === "requested" ? "action-needed" : "read",
});

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

  return matches.map(toMatchCard);
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

  return items.map(toInboxItem);
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export type AuthResponse = {
  session: AuthSession;
};

const MOCK_CREDENTIALS_KEY = "campusConnect.credentials";

type MockCredential = {
  email: string;
  password: string;
  userId: string;
  displayName: string;
};

function getMockCredentials(): MockCredential[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(
      window.localStorage.getItem(MOCK_CREDENTIALS_KEY) || "[]",
    );
  } catch {
    return [];
  }
}

function saveMockCredentials(creds: MockCredential[]): void {
  window.localStorage.setItem(MOCK_CREDENTIALS_KEY, JSON.stringify(creds));
}

export async function signup(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResponse> {
  if (USE_MOCKS) {
    const existing = getMockCredentials();
    if (existing.some((c) => c.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("An account with this email already exists.");
    }
    const userId = makeId("user");
    saveMockCredentials([
      ...existing,
      { email, password, userId, displayName },
    ]);

    const session: AuthSession = {
      userId,
      email,
      displayName,
      token: `mock_token_${userId}`,
      createdAt: nowIso(),
    };
    return { session };
  }

  return apiFetch<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, displayName }),
  });
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  if (USE_MOCKS) {
    const existing = getMockCredentials();
    const match = existing.find(
      (c) =>
        c.email.toLowerCase() === email.toLowerCase() &&
        c.password === password,
    );
    if (!match) {
      throw new Error("Invalid email or password.");
    }

    const session: AuthSession = {
      userId: match.userId,
      email: match.email,
      displayName: match.displayName,
      token: `mock_token_${match.userId}`,
      createdAt: nowIso(),
    };
    return { session };
  }

  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout(): void {
  if (USE_MOCKS) {
    return;
  }
  apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
}
