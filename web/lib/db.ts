// web/lib/db.ts
import users from "@/seed/users.json";
import requests from "@/seed/requests.json";
import type { User, HelpRequest, Match } from "@/lib/types";

type AnyDoc = any;

type SeedStore = {
  users: User[];
  requests: HelpRequest[];
  matches: Match[];
};

declare global {
  // eslint-disable-next-line no-var
  var __seedStore: SeedStore | undefined;
}

const store: SeedStore =
  globalThis.__seedStore ??
  (globalThis.__seedStore = {
    users: users as User[],
    requests: requests as HelpRequest[],
    matches: [],
  });

// Minimal Mongo-like helpers for your routes
function matchesQuery(doc: AnyDoc, query: AnyDoc) {
  for (const [k, v] of Object.entries(query)) {
    if (v && typeof v === "object" && "$ne" in v) {
      if (doc[k] === (v as any).$ne) return false;
    } else {
      if (doc[k] !== v) return false;
    }
  }
  return true;
}

function getCollection(name: keyof SeedStore) {
  return {
    async findOne(query: AnyDoc) {
      return store[name].find((d) => matchesQuery(d, query)) ?? null;
    },
    find(query: AnyDoc) {
      const filtered = store[name].filter((d) => matchesQuery(d, query));
      return {
        async toArray() {
          return filtered;
        },
      };
    },
    async updateOne(filter: AnyDoc, update: AnyDoc, opts?: { upsert?: boolean }) {
      const idx = store[name].findIndex((d) => matchesQuery(d, filter));
      const set = update?.$set ?? {};
      const setOnInsert = update?.$setOnInsert ?? {};

      if (idx >= 0) {
        store[name][idx] = { ...(store[name][idx] as AnyDoc), ...set };
        return { matchedCount: 1, upsertedId: null };
      }

      if (opts?.upsert) {
        const doc = { ...setOnInsert, ...set };
        (store[name] as AnyDoc[]).push(doc);
        return { matchedCount: 0, upsertedId: doc.id ?? null };
      }

      return { matchedCount: 0, upsertedId: null };
    },
  };
}

export async function getDb(): Promise<any> {
  return {
    collection(name: keyof SeedStore) {
      return getCollection(name);
    },
  };
}

export function __seedStore() {
  return store;
}
