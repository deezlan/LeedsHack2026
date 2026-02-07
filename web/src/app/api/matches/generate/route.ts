import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rankTopN, makeMatch, makeMatchId } from "@/lib/matching";
import type { HelpRequest, User, Match, MatchState } from "@/lib/types";

const PROGRESSED: MatchState[] = ["requested", "accepted", "declined"];

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

    // Build suggested matches (fresh)
    const suggested: Match[] = ranked.map((r) => {
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

    // Guardrail: do NOT reset progressed matches back to suggested.
    // If a match exists with state requested/accepted/declined, keep it as-is.
    const finalMatches: Match[] = [];

    await Promise.all(
      suggested.map(async (m) => {
        const existing = (await db.collection("matches").findOne({ id: m.id })) as Match | null;

        if (existing && PROGRESSED.includes(existing.state)) {
          // keep existing match; do not overwrite state/payload
          finalMatches.push(existing);
          return;
        }

        await db.collection("matches").updateOne(
          { id: m.id },
          {
            $set: { ...m, updatedAt: nowIso },
            $setOnInsert: { createdAt: nowIso },
          },
          { upsert: true }
        );

        finalMatches.push(m);
      })
    );

    // Return matches in the ranked order (finalMatches may be out of order due to Promise.all)
    const byId = new Map(finalMatches.map((x) => [x.id, x]));
    const ordered = suggested.map((m) => byId.get(m.id)!).filter(Boolean);

    return NextResponse.json({ requestId: request.id, matches: ordered });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
