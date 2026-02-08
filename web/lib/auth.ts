const SESSION_KEY = "campusConnect.session";

export type AuthSession = {
  userId: string;
  email: string;
  displayName: string;
  token: string;
  createdAt: string; // ISO
};

/** Read the current session from localStorage. Returns null if absent or invalid. */
export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.userId === "string" &&
      typeof parsed.email === "string"
    ) {
      return parsed as AuthSession;
    }
    return null;
  } catch {
    return null;
  }
}

/** Persist a new session to localStorage. */
export function setSession(session: AuthSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/** Remove the session from localStorage. */
export function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
}

/** Quick boolean check. */
export function isAuthed(): boolean {
  return getSession() !== null;
}
