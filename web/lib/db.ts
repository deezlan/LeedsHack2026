// web/lib/db.ts
import users from "@/seed/users.json";
import requests from "@/seed/requests.json";
import type { User, HelpRequest, Match } from "@/lib/types";

type AnyDoc = any;

type Message = {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  createdAt: string;
};

type SeedStore = {
  users: User[];
  requests: HelpRequest[];
  matches: Match[];
  messages: Message[];
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
    messages: [],
  } as any);

// --- dev hot-reload safety: migrate older cached store shapes ---
(store as any).users ??= [];
(store as any).requests ??= [];
(store as any).matches ??= [];
(store as any).messages ??= [];

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
  const col = (store as any)[name];

  if (!Array.isArray(col)) {
    throw new Error(
      `Unknown collection "${String(name)}". Available: ${Object.keys(store).join(", ")}`
    );
  }

  return {
    async findOne(query: AnyDoc) {
      return col.find((d: AnyDoc) => matchesQuery(d, query)) ?? null;
    },
    async insertOne(doc: AnyDoc) {
      col.push(doc);
      return { insertedId: doc.id ?? null };
    },
    find(query: AnyDoc) {
      let results = col.filter((d: AnyDoc) => matchesQuery(d, query));

      // Return a tiny Mongo-like cursor
      const cursor = {
        sort(sortSpec: Record<string, 1 | -1>) {
          const [[field, dir]] = Object.entries(sortSpec);

          results = results.sort((a: AnyDoc, b: AnyDoc) => {
            const av = a?.[field];
            const bv = b?.[field];

            // If these are ISO timestamps, string compare works
            if (typeof av === "string" && typeof bv === "string") {
              return dir === 1 ? av.localeCompare(bv) : bv.localeCompare(av);
            }

            // Fallback for numbers / others
            if (av < bv) return dir === 1 ? -1 : 1;
            if (av > bv) return dir === 1 ? 1 : -1;
            return 0;
          });

          return cursor;
        },

        limit(n: number) {
          results = results.slice(0, n);
          return cursor;
        },

        async toArray() {
          return results;
        },
      };

      return cursor;
    },
    async updateOne(filter: AnyDoc, update: AnyDoc, opts?: { upsert?: boolean }) {
      const idx = col.findIndex((d: AnyDoc) => matchesQuery(d, filter));
      const set = update?.$set ?? {};
      const setOnInsert = update?.$setOnInsert ?? {};

      if (idx >= 0) {
        col[idx] = { ...(col[idx] as AnyDoc), ...set };
        return { matchedCount: 1, upsertedId: null };
      }

      if (opts?.upsert) {
        const doc = { ...setOnInsert, ...set };
        col.push(doc);
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
