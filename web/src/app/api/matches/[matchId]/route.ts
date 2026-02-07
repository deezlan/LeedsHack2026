import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await ctx.params;
    const db = await getDb();

    const match = await db.collection("matches").findOne({ id: matchId });
    if (!match) return NextResponse.json({ error: "match not found" }, { status: 404 });

    return NextResponse.json(match);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
