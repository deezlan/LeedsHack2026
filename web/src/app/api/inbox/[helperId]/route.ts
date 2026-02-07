import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ helperId: string }> }
) {
  try {
    const { helperId } = await ctx.params;
    const db = await getDb();

    const matches = await db.collection("matches").find({ helperId }).toArray();

    // Only show those that are relevant in inbox
    const items = matches.filter((m: any) => m.state === "requested" || m.state === "accepted" || m.state === "declined");

    // newest first
    items.sort((a: any, b: any) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
