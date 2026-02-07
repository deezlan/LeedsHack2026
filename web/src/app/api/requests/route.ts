// web/src/app/api/requests/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { HelpRequest } from "@/lib/types";

type CreateRequestBody = {
  requesterId?: string;
  title?: string;
  description?: string;
  urgency?: HelpRequest["urgency"];
  format?: HelpRequest["format"];
  tags?: HelpRequest["tags"];
};

const makeId = () => `r_${Math.random().toString(36).slice(2, 10)}`;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateRequestBody;

    const requesterId = body.requesterId?.trim();
    const title = body.title?.trim();
    const description = body.description?.trim();
    const urgency = body.urgency ?? "medium";
    const format = body.format ?? "chat";
    const tags = Array.isArray(body.tags) ? body.tags : [];

    if (!requesterId) return NextResponse.json({ error: "requesterId required" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
    if (!description) return NextResponse.json({ error: "description required" }, { status: 400 });

    const nowIso = new Date().toISOString();
    const request: HelpRequest = {
      id: makeId(),
      requesterId,
      title,
      description,
      urgency,
      format,
      tags,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const db = await getDb();

    // Your seed DB helper supports updateOne + upsert
    await db.collection("requests").updateOne(
      { id: request.id },
      { $set: request, $setOnInsert: { createdAt: nowIso } },
      { upsert: true }
    );

    return NextResponse.json({ request }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
