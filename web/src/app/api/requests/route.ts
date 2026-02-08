import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { HelpRequest } from "@/lib/types";

let requestsCol: undefined | (() => Promise<any>);
let ObjectId: any;
let AllowedTags: any[] | undefined;

try {
  // If Dev B/D mongo helpers exist, use them
  ({ requestsCol } = require("@/lib/db_types"));
  ({ ObjectId } = require("mongodb"));
  ({ AllowedTags } = require("@/lib/tags"));
} catch {
  // Seed-store mode
}

type CreateRequestBody = {
  requesterId?: string;
  title?: string;
  description?: string;
  urgency?: HelpRequest["urgency"];
  format?: HelpRequest["format"];
  tags?: HelpRequest["tags"];
};

const makeId = () => `req_${Math.random().toString(36).slice(2, 10)}`;
const nowIso = () => new Date().toISOString();

function normaliseTags(tags: any): string[] {
  const arr = Array.isArray(tags) ? tags : [];
  if (Array.isArray(AllowedTags) && AllowedTags.length) {
    return arr.filter((t) => AllowedTags.includes(t));
  }
  return arr;
}

// Optional: handy for debugging/admin.
// Not required by your current frontend, but safe to keep.
export async function GET() {
  try {
    // Mongo path
    if (requestsCol) {
      const col = await requestsCol();
      const docs = await col.find({}).sort({ createdAt: -1 }).toArray();

      const requests = docs.map((r: any) => ({
        id: r._id?.toString?.() ?? r.id ?? "",
        requesterId: r.requesterId?.toString?.() ?? "",
        title: r.title ?? "",
        description: r.description ?? "",
        urgency: r.urgency ?? "medium",
        format: r.format ?? "chat",
        tags: Array.isArray(r.tags) ? r.tags : [],
        createdAt: r.createdAt?.toISOString?.() ?? nowIso(),
        updatedAt: r.updatedAt?.toISOString?.() ?? r.createdAt?.toISOString?.() ?? nowIso(),
      }));

      return NextResponse.json({ requests });
    }

    // Seed path
    const db = await getDb();
    const requests = await db.collection("requests").find({}).toArray();
    requests.sort((a: any, b: any) =>
      String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))
    );

    return NextResponse.json({ requests });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateRequestBody;

    const requesterId = body.requesterId?.trim();
    const title = body.title?.trim();
    const description = body.description?.trim();
    const urgency = body.urgency ?? "medium";
    const format = body.format ?? "chat";
    const tags = normaliseTags(body.tags);

    if (!requesterId) return NextResponse.json({ error: "requesterId required" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
    if (!description) return NextResponse.json({ error: "description required" }, { status: 400 });

    // --- Mongo implementation (Dev B/D) ---
    if (requestsCol && ObjectId?.isValid?.(requesterId)) {
      const col = await requestsCol();
      const now = new Date();

      const result = await col.insertOne({
        requesterId: new ObjectId(requesterId),
        title,
        description,
        urgency,
        format,
        tags,
        createdAt: now,
        updatedAt: now,
      });

      const request: HelpRequest = {
        id: result.insertedId.toString(),
        requesterId,
        title,
        description,
        urgency,
        format,
        tags,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      // IMPORTANT: your frontend expects { request }
      return NextResponse.json({ request }, { status: 201 });
    }

    // --- Seed-store implementation (yours) ---
    const ts = nowIso();
    const request: HelpRequest = {
      id: makeId(),
      requesterId,
      title,
      description,
      urgency,
      format,
      tags,
      createdAt: ts,
      updatedAt: ts,
    };

    const db = await getDb();
    await db.collection("requests").updateOne(
      { id: request.id },
      { $set: request, $setOnInsert: { createdAt: ts } },
      { upsert: true }
    );

    return NextResponse.json({ request }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
