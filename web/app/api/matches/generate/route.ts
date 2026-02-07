import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rankTopN, makeMatch, makeMatchId } from "@/lib/matching";
import type { HelpRequest, User, Match } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestId = body?.requestId as string | undefined;
    const topN = Math.max(1, Math.min(20, Number(body?.topN ?? 5)));

    if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

    const db = await getDb();

    const requestDoc = await db.collection("requests").findOne({ id: requestId });
    if (!requestDoc) return NextResponse.json({ error: "request not found" }, { status: 404 });
    const request = requestDoc as HelpRequest;

    const requesterDoc = await db.collection("users").findOne({ id: request.requesterId });
    if (!requesterDoc) return NextResponse.json({ error: "requester not found" }, { status: 404 });
    const requester = requesterDoc as User;

    const candidates = (await db
      .collection("users")
      .find({ id: { $ne: requester.id } })
      .toArray()) as User[];

    const ranked = rankTopN({ request, requester, candidates, n: topN });

    const nowIso = new Date().toISOString();

    const matches: Match[] = ranked.map((r) => {
      const id = makeMatchId(request.id, r.helper.id);
      return makeMatch({
        id,
        requestId: request.id,
        requesterId: requester.id,
        helperId: r.helper.id,
        score: r.score,
        reasons: r.reasons,
        state: "suggested",
        nowIso,
      });
    });

    // Upsert by deterministic id so regenerating doesn't duplicate
    await Promise.all(
      matches.map((m) =>
        db.collection("matches").updateOne(
          { id: m.id },
          {
            $set: { ...m, updatedAt: nowIso },
            $setOnInsert: { createdAt: nowIso },
          },
          { upsert: true }
        )
      )
    );

    return NextResponse.json({ requestId: request.id, matches });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
