import {ObjectId, Collection} from "mongodb";
import type { AllowedTag } from "./tags";
import { getDb } from "./db";


// database  model 
export interface UserDB {
  _id?: ObjectId;
  username: string;
  name: string;
  bio?: string;
  tags: AllowedTag[];
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HelpRequestDB {
  _id?: ObjectId;
  requesterId: ObjectId;
  title: string;
  description: string;
  urgency: "low" | "medium" | "high";
  format: "chat" | "call" | "async";
  tags: AllowedTag[];
  createdAt: Date;
  updatedAt: Date;
}


export type MatchState = "suggested" | "requested" | "accepted" | "declined";

export interface MatchDB {
  _id?: ObjectId;
  requestId: ObjectId;
  requesterId: ObjectId;
  helperId: ObjectId;
  score: number;
  reasons: string[];
  state: MatchState;
  connectionPayload?: {
    message?: string;
    nextStep?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// initialise the database
export async function initialiseDatabase(){

  const db = await getDb();

  console.log("Creating database indexes...");

  // Users collection indexes
  await db.collection("users").createIndex({ username: 1 }, { unique: true });
  await db.collection("users").createIndex({ tags: 1 });
  await db.collection("users").createIndex({ name: 1 });

  // Requests collection indexes
  await db.collection("requests").createIndex({ requesterId: 1 });
  await db.collection("requests").createIndex({ tags: 1 });
  await db.collection("requests").createIndex({ createdAt: -1 });

  // Matches collection indexes
  await db
    .collection("matches")
    .createIndex({ requestId: 1, helperId: 1 }, { unique: true });
  await db.collection("matches").createIndex({ helperId: 1, state: 1 });
  await db.collection("matches").createIndex({ requesterId: 1, state: 1 });
}


export async function usersCol(): Promise<Collection<UserDB>> {
  const db = await getDb();
  return db.collection<UserDB>("users");
}

export async function requestsCol(): Promise<Collection<HelpRequestDB>> {
  const db = await getDb();
  return db.collection<HelpRequestDB>("requests");
}

export async function matchesCol(): Promise<Collection<MatchDB>> {
  const db = await getDb();
  return db.collection<MatchDB>("matches");
}