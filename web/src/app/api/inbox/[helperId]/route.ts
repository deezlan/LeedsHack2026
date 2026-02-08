import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Optional Mongo path (only used if available + helperId is ObjectId)
let matchesCol: undefined | (() => Promise<any>);
let ObjectId: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ({ matchesCol } = require("@/lib/db_types"));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ({ ObjectId } = require("mongodb"));
} catch {
  // running in seed-store mode; ignore
}

const INBOX_STATES = ["requested", "accepted", "declined"] as const;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ helperId: string }> }
) {
  try {
    const { helperId } = await ctx.params;

    // --- Mongo implementation (Dev B/D) ---
    if (matchesCol && ObjectId?.isValid?.(helperId)) {
      const col = await matchesCol();

      const docs = await col
        .find({
          helperId: new ObjectId(helperId),
          state: { $in: INBOX_STATES as any },
        })
        .sort({ updatedAt: -1, createdAt: -1 })
        .toArray();

      // IMPORTANT: return { items } to match your lib/api.getInbox()
      const items = docs.map((m: any) => {
        const createdAt =
          m.createdAt?.toISOString?.() ??
          (typeof m.createdAt === "string" ? m.createdAt : new Date().toISOString());

        const updatedAt =
          m.updatedAt?.toISOString?.() ??
          (typeof m.updatedAt === "string" ? m.updatedAt : createdAt);

        return {
          id: m._id?.toString?.() ?? m.id?.toString?.() ?? "",
          requestId: m.requestId?.toString?.() ?? "",
          requesterId: m.requesterId?.toString?.() ?? "",
          helperId: m.helperId?.toString?.() ?? "",
          score: m.score ?? 0,
          reasons: Array.isArray(m.reasons) ? m.reasons : [],
          state: m.state,
          connectionPayload: m.connectionPayload,
          createdAt,
          updatedAt,
        };
      });

      return NextResponse.json({ items });
    }

    // --- Seed-store implementation (yours) ---
    const db = await getDb();
    const matches = await db.collection("matches").find({ helperId }).toArray();

    const items = matches
      .filter((m: any) => INBOX_STATES.includes(m.state))
      .sort((a: any, b: any) =>
        String(b.updatedAt ?? b.createdAt ?? "").localeCompare(
          String(a.updatedAt ?? a.createdAt ?? "")
        )
      );

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}
