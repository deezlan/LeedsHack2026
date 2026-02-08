import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await ctx.params;
    const body = await req.json();

    // Accept both: decision ("accepted"/"declined") OR action ("accept"/"decline")
    const decision = body?.decision as "accepted" | "declined" | undefined;
    const action = body?.action as "accept" | "decline" | undefined;

    const nextState =
      decision ?? (action === "accept" ? "accepted" : action === "decline" ? "declined" : undefined);

    const connectionPayload = body?.connectionPayload as { message?: string; nextStep?: string } | undefined;

    if (nextState !== "accepted" && nextState !== "declined") {
      return NextResponse.json({ error: "Provide decision (accepted|declined) or action (accept|decline)" }, { status: 400 });
    }

    const db = await getDb();
    const match = await db.collection("matches").findOne({ id: matchId });
    if (!match) return NextResponse.json({ error: "match not found" }, { status: 404 });

    if (match.state !== "requested") {
      return NextResponse.json({ error: `invalid transition from ${match.state}` }, { status: 409 });
    }

    const nowIso = new Date().toISOString();
    const update: any = { state: nextState, updatedAt: nowIso };
    if (nextState === "accepted") update.connectionPayload = connectionPayload ?? {};

    await db.collection("matches").updateOne({ id: matchId }, { $set: update });

    const updated = await db.collection("matches").findOne({ id: matchId });
    return NextResponse.json({ match: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
