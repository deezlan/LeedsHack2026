// web/lib/db.ts
import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uriFromEnv = process.env.MONGODB_URI;
if (!uriFromEnv) {
  throw new Error("Missing MONGODB_URI in environment.");
}
const uri: string = uriFromEnv;

const dbName = process.env.MONGODB_DB;

function getClientPromise() {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  const client = new MongoClient(uri);
  return client.connect();
}

export async function getDb() {
  const client = await getClientPromise();
  return dbName ? client.db(dbName) : client.db();
}
