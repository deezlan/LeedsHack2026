import "dotenv/config";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { ObjectId } from "mongodb";
import { usersCol, requestsCol, matchesCol, initialiseDatabase } from "../lib/db_types";
import { AllowedTags } from "../lib/tags";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve paths relative to *this file*, not where you run the command from
const usersPath = path.join(__dirname, "users.json");
const requestsPath = path.join(__dirname, "requests.json");

function normaliseTags(tags: any) {
  const arr = Array.isArray(tags) ? tags : [];
  return arr.filter((t) => AllowedTags.includes(t));
}

async function seed() {
  console.log("Starting database seed...");
  console.log("MONGODB_URI =", process.env.MONGODB_URI);

  // ensure indexes exist
  await initialiseDatabase();

  const usersCollection = await usersCol();
  const requestsCollection = await requestsCol();
  const matchesCollection = await matchesCol();

  // clear old data
  await usersCollection.deleteMany({});
  await requestsCollection.deleteMany({});
  await matchesCollection.deleteMany({});
  console.log("Cleared old collections");

  // read users.json
  const rawUsers = await readFile(usersPath, "utf-8");
  const users = JSON.parse(rawUsers);

  const now = new Date();

  // transform into DB shape
  const userDocs = users.map((u: any) => ({
    username: u.id,                // IMPORTANT: required by UserDB
    name: u.name,
    bio: u.bio ?? "",
    tags: normaliseTags(u.tags),
    timezone: u.timezone ?? "UTC",
    createdAt: now,
    updatedAt: now,
  }));

  const result = await usersCollection.insertMany(userDocs);
  console.log(`Inserted ${result.insertedCount} users`);

  // map seed ids (u1/u2/...) -> Mongo ObjectId
  const userIdMap: Record<string, ObjectId> = {};
  users.forEach((u: any, index: number) => {
    const insertedId = Object.values(result.insertedIds)[index] as ObjectId;
    userIdMap[u.id] = insertedId;
  });

  // read requests.json
  const rawRequests = await readFile(requestsPath, "utf-8");
  const requests = JSON.parse(rawRequests);

  const requestDocs = requests.map((r: any) => ({
    requesterId: userIdMap[r.requesterId],
    title: r.title,
    description: r.description,
    urgency: r.urgency ?? "medium",
    format: r.format ?? "async",
    tags: normaliseTags(r.tags),
    createdAt: now,
    updatedAt: now,
  }));

  const requestResult = await requestsCollection.insertMany(requestDocs);
  console.log(`Inserted ${requestResult.insertedCount} requests`);

  console.log("Seed completed successfully");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
