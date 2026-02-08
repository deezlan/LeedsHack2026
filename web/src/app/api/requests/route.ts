// web/src/app/api/requests/route.ts
import { NextResponse } from "next/server";
import { requestsCol, usersCol } from "@/lib/db_types";
import { AllowedTags } from "@/lib/tags";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const requesterId = String(body.requesterId ?? "").trim();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();

    if (!requesterId || !title || !description) {
      return NextResponse.json(
        { error: "requesterId, title, description are required" },
        { status: 400 }
      );
    }

    // STRICT: requesterId must be an ObjectId string
    if (!ObjectId.isValid(requesterId)) {
      return NextResponse.json(
        { error: "requesterId must be a valid ObjectId string (Mongo user _id)" },
        { status: 400 }
      );
    }

    // Optional: ensure user exists (helps debugging)
    const ucol = await usersCol();
    const user = await ucol.findOne({ _id: new ObjectId(requesterId) });
    if (!user) {
      return NextResponse.json({ error: "requesterId user not found" }, { status: 404 });
    }

    const tags = Array.isArray(body.tags)
      ? body.tags.filter((t: string) => AllowedTags.includes(t as any))
      : [];

    const now = new Date();
    const col = await requestsCol();

    const result = await col.insertOne({
      requesterId: new ObjectId(requesterId),
      title,
      description,
      urgency: body.urgency ?? "medium",
      format: body.format ?? "chat",
      tags,
      createdAt: now,
      updatedAt: now,
    } as any);

    return NextResponse.json(
      {
        request: {
          id: result.insertedId.toString(),
          requesterId,
          title,
          description,
          urgency: body.urgency ?? "medium",
          format: body.format ?? "chat",
          tags,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("POST /api/requests error:", e);
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
