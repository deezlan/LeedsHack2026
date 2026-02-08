import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await ctx.params;
    const db = await getDb();

    const match = await db.collection("matches").findOne({ id: matchId });
    if (!match) return NextResponse.json({ error: "match not found" }, { status: 404 });

    if (match.state !== "suggested") {
      return NextResponse.json({ error: `invalid transition from ${match.state}` }, { status: 409 });
    }

    const nowIso = new Date().toISOString();
    await db.collection("matches").updateOne(
      { id: matchId },
      { $set: { state: "requested", updatedAt: nowIso } }
    );

    const updated = await db.collection("matches").findOne({ id: matchId });
    return NextResponse.json({ match: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
