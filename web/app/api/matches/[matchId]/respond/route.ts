import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await ctx.params;

    const body = await req.json();
    const action = body?.action as "accept" | "decline" | undefined;
    const connectionPayload = body?.connectionPayload as { message?: string; nextStep?: string } | undefined;

    if (action !== "accept" && action !== "decline") {
      return NextResponse.json({ error: "action must be accept|decline" }, { status: 400 });
    }

    const db = await getDb();
    const match = await db.collection("matches").findOne({ id: matchId });
    if (!match) return NextResponse.json({ error: "match not found" }, { status: 404 });

    if (match.state !== "requested") {
      return NextResponse.json({ error: `invalid transition from ${match.state}` }, { status: 409 });
    }

    const nowIso = new Date().toISOString();
    const nextState = action === "accept" ? "accepted" : "declined";

    const update: any = { state: nextState, updatedAt: nowIso };
    if (nextState === "accepted") update.connectionPayload = connectionPayload ?? {};

    await db.collection("matches").updateOne({ id: matchId }, { $set: update });

    return NextResponse.json({ id: matchId, state: nextState });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
