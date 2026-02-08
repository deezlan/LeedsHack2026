import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { rankTopN, makeMatch, makeMatchId } from "@/lib/matching";
import type { HelpRequest, User, Match, MatchState } from "@/lib/types";

const PROGRESSED: MatchState[] = ["requested", "accepted", "declined"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestId = body?.requestId as string | undefined;
    const topN = Math.max(1, Math.min(20, Number(body?.topN ?? 5)));

    if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });
    if (!ObjectId.isValid(requestId)) {
      return NextResponse.json({ error: "invalid requestId (must be ObjectId)" }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date();
    const nowIso = now.toISOString();

    // --- Mongo docs ---
    const requestDoc = await db.collection("requests").findOne({ _id: new ObjectId(requestId) });
    if (!requestDoc) return NextResponse.json({ error: "request not found" }, { status: 404 });

    const requesterDoc = await db.collection("users").findOne({ _id: requestDoc.requesterId });
    if (!requesterDoc) return NextResponse.json({ error: "requester not found" }, { status: 404 });

    // Convert DB docs -> app types (strings + ISO) so matching.ts keeps working
    const request: HelpRequest = {
      id: requestDoc._id.toString(),
      requesterId: requestDoc.requesterId.toString(),
      title: requestDoc.title,
      description: requestDoc.description,
      urgency: requestDoc.urgency ?? "medium",
      format: requestDoc.format ?? "chat",
      tags: Array.isArray(requestDoc.tags) ? requestDoc.tags : [],
      createdAt: (requestDoc.createdAt instanceof Date ? requestDoc.createdAt : now).toISOString(),
      updatedAt: (requestDoc.updatedAt instanceof Date ? requestDoc.updatedAt : now).toISOString(),
    };

    const requester: User = {
      id: requesterDoc._id.toString(),
      username: requesterDoc.username ?? requesterDoc.name ?? "unknown",
      name: requesterDoc.name ?? requesterDoc.username ?? "Unknown",
      bio: requesterDoc.bio ?? "",
      tags: Array.isArray(requesterDoc.tags) ? requesterDoc.tags : [],
      timezone: requesterDoc.timezone ?? "UTC",
      createdAt: (requesterDoc.createdAt instanceof Date ? requesterDoc.createdAt : now).toISOString(),
      updatedAt: (requesterDoc.updatedAt instanceof Date ? requesterDoc.updatedAt : now).toISOString(),
    };

    const candidateDocs = await db
      .collection("users")
      .find({ _id: { $ne: requesterDoc._id } })
      .toArray();

    const candidates: User[] = candidateDocs.map((u: any) => ({
      id: u._id.toString(),
      username: u.username ?? u.name ?? "unknown",
      name: u.name ?? u.username ?? "Unknown",
      bio: u.bio ?? "",
      tags: Array.isArray(u.tags) ? u.tags : [],
      timezone: u.timezone ?? "UTC",
      createdAt: (u.createdAt instanceof Date ? u.createdAt : now).toISOString(),
      updatedAt: (u.updatedAt instanceof Date ? u.updatedAt : now).toISOString(),
    }));

    const ranked = rankTopN({ request, requester, candidates, n: topN });

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

    const finalMatches: Match[] = [];

    await Promise.all(
      suggested.map(async (m) => {
        const existing = await db.collection("matches").findOne({ id: m.id });

        if (existing && PROGRESSED.includes(existing.state)) {
          finalMatches.push({
            ...existing,
            id: existing.id,
            requestId: existing.requestId?.toString?.() ?? request.id,
            requesterId: existing.requesterId?.toString?.() ?? requester.id,
            helperId: existing.helperId?.toString?.() ?? "",
            createdAt: (existing.createdAt instanceof Date ? existing.createdAt : now).toISOString(),
            updatedAt: (existing.updatedAt instanceof Date ? existing.updatedAt : now).toISOString(),
          } as any);
          return;
        }

        const { createdAt: _ignore, ...rest } = m as any;

        await db.collection("matches").updateOne(
          { id: m.id },
          {
            $set: {
              ...rest,
              // store ObjectId refs too if you want:
              requestId: new ObjectId(request.id),
              requesterId: new ObjectId(requester.id),
              helperId: new ObjectId(m.helperId),
              updatedAt: now,
            },
            $setOnInsert: { createdAt: now },
          },
          { upsert: true }
        );

        finalMatches.push(m);
      })
    );

    const byId = new Map(finalMatches.map((x) => [x.id, x]));
    const ordered = suggested.map((m) => byId.get(m.id)!).filter(Boolean);

    return NextResponse.json({ requestId: request.id, matches: ordered });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
