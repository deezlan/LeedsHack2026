// web/src/app/api/debug/store/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  // Safety: only expose in dev (and optionally preview)
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const db = await getDb();

    // Return a minimal shape your frontend already expects:
    // { users: [{id, name}], requests: [...], matches: [...] }
    const [users, requests, matches] = await Promise.all([
      db
        .collection("users")
        .find({}, { projection: { name: 1, username: 1 } })
        .limit(200)
        .toArray(),
      db.collection("requests").find({}).limit(200).toArray(),
      db.collection("matches").find({}).limit(200).toArray(),
    ]);

    return NextResponse.json({
      users: users.map((u: any) => ({
        id: u._id?.toString?.() ?? "",
        name: u.name ?? u.username ?? "",
      })),
      requests: requests.map((r: any) => ({
        ...r,
        _id: r._id?.toString?.(),
        requesterId: r.requesterId?.toString?.(),
      })),
      matches: matches.map((m: any) => ({
        ...m,
        _id: m._id?.toString?.(),
        requestId: m.requestId?.toString?.(),
        requesterId: m.requesterId?.toString?.(),
        helperId: m.helperId?.toString?.(),
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
