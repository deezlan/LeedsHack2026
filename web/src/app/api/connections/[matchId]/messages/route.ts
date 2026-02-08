import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const nowIso = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await ctx.params;
    const db = await getDb();

    // Optional but recommended: ensure match exists
    const match = await db.collection("matches").findOne({ id: matchId });
    if (!match) return NextResponse.json({ error: "match not found" }, { status: 404 });

    const messages = await db
      .collection("messages")
      .find({ matchId })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json({ messages });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await ctx.params;
    const body = await req.json();

    const text = String(body?.text ?? "").trim();
    const senderId = String(body?.senderId ?? "").trim();
    const senderRole = body?.senderRole as "requester" | "helper" | undefined;

    if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });
    if (!senderId) return NextResponse.json({ error: "senderId is required" }, { status: 400 });
    if (senderRole !== "requester" && senderRole !== "helper") {
      return NextResponse.json({ error: "senderRole must be requester|helper" }, { status: 400 });
    }

    const db = await getDb();
    const match = await db.collection("matches").findOne({ id: matchId });
    if (!match) return NextResponse.json({ error: "match not found" }, { status: 404 });

    // Gate sending until accepted (recommended)
    if (match.state !== "accepted") {
      return NextResponse.json({ error: "match not accepted yet" }, { status: 409 });
    }

    // Simple guard: sender must be one of the two participants
    if (senderId !== match.requesterId && senderId !== match.helperId) {
      return NextResponse.json({ error: "sender is not a participant in this match" }, { status: 403 });
    }

    const message = {
      id: makeId("msg"),
      matchId,
      senderId,
      senderRole,
      text,
      createdAt: nowIso(),
    };

    await db.collection("messages").insertOne(message);

    // optionally bump match.updatedAt
    await db.collection("matches").updateOne(
      { id: matchId },
      { $set: { updatedAt: nowIso() } }
    );

    return NextResponse.json({ message });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
