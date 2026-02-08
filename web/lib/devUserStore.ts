// src/lib/devUserStore.ts
export type DevUser = {
  id: string;
  email: string; // stored lowercased
  password: string; // plaintext for dev only (hash later)
  displayName: string;
};

// Use globalThis so it survives hot reload in dev
const g = globalThis as unknown as { __devUsers?: Map<string, DevUser> };

export const devUsers: Map<string, DevUser> =
  g.__devUsers ?? (g.__devUsers = new Map());

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
