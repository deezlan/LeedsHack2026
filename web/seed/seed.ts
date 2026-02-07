import "dotenv/config";
import { readFile } from "fs/promises";
import { ObjectId } from "mongodb";
import { usersCol, requestsCol, matchesCol } from "../lib/db_types";
import { initialiseDatabase } from "../lib/db_types";

async function seed() {
  console.log("Starting database seed...");

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
  const raw = await readFile("seed/users.json", "utf-8");
  const users = JSON.parse(raw);

  const now = new Date();

  // transform into DB shape
  const userDocs = users.map((u: any) => ({
    name: u.name,
    bio: "",
    tags: u.tags ?? [],
    timezone: "UTC",
    createdAt: now,
    updatedAt: now,
  }));

  const result = await usersCollection.insertMany(userDocs);



  console.log(`Inserted ${result.insertedCount} users`);

  const userIdMap: Record<string, ObjectId> = {};
  users.forEach((u: any, index: number) => {
    const insertedId = Object.values(result.insertedIds)[index];
    userIdMap[u.id] = insertedId;
  });

  const rawRequests = await readFile("seed/requests.json", "utf-8");
  const requests = JSON.parse(rawRequests);

  const requestDocs = requests.map((r: any) => ({
    requesterId: userIdMap[r.requesterId],
    title: r.title,
    description: r.description,
    urgency: r.urgency ?? "medium",
    format: r.format ?? "async",
    tags: r.tags ?? [],
    createdAt: now,
    updatedAt: now,
  }));

  const requestResult = await requestsCollection.insertMany(requestDocs);

  console.log(` Inserted ${requestResult.insertedCount} requests`);

  console.log("Seed completed successfully");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
