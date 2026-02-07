import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(_: Request, { params }: { params: { matchId: string } }) {
  try {
    const db = await getDb();
    const match = await db.collection("matches").findOne({ id: params.matchId });
    if (!match) return NextResponse.json({ error: "match not found" }, { status: 404 });

    if (match.state !== "suggested") {
      return NextResponse.json({ error: `invalid transition from ${match.state}` }, { status: 409 });
    }

    const nowIso = new Date().toISOString();
    await db.collection("matches").updateOne(
      { id: params.matchId },
      { $set: { state: "requested", updatedAt: nowIso } }
    );

    return NextResponse.json({ id: params.matchId, state: "requested" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
