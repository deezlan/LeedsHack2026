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

  console.log("Seed completed successfully");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
