// web/lib/db.ts
import users from "@/seed/users.json";
import requests from "@/seed/requests.json";
import type { User, HelpRequest, Match } from "@/lib/types";

// --------------------
// Seed-store fallback
// --------------------
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
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<any> | undefined;
}

const store: SeedStore =
  globalThis.__seedStore ??
  (globalThis.__seedStore = {
    users: users as User[],
    requests: requests as HelpRequest[],
    matches: [],
    messages: [],
  } as any);

// hot-reload safety
(store as any).users ??= [];
(store as any).requests ??= [];
(store as any).matches ??= [];
(store as any).messages ??= [];

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

function getSeedCollection(name: keyof SeedStore) {
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

      const cursor = {
        sort(sortSpec: Record<string, 1 | -1>) {
          const [[field, dir]] = Object.entries(sortSpec);
          results = results.sort((a: AnyDoc, b: AnyDoc) => {
            const av = a?.[field];
            const bv = b?.[field];
            if (typeof av === "string" && typeof bv === "string") {
              return dir === 1 ? av.localeCompare(bv) : bv.localeCompare(av);
            }
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

    // Let Mongo-using routes call this safely in seed mode
    async createIndex() {
      return "seed_noop_index";
    },
  };
}

function getSeedDb() {
  return {
    collection(name: keyof SeedStore) {
      return getSeedCollection(name);
    },
  };
}

// --------------------
// Mongo path (Dev B/D)
// --------------------
async function getMongoDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  // dynamic import to avoid crashing if mongodb isn’t installed in some setups
  const { MongoClient } = await import("mongodb");

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    const client = await global._mongoClientPromise!;
    return client.db(); // DB name comes from URI
  } else {
    const client = new MongoClient(uri);
    await client.connect();
    return client.db();
  }
}

// --------------------
// Unified export
// --------------------
export async function getDb(): Promise<any> {
  const mongo = await getMongoDb();
  return mongo ?? getSeedDb();
}

export function __seedStore() {
  return store;
}
