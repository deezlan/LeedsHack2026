import { NextResponse } from "next/server";
import { __seedStore } from "@/lib/db";

export async function GET() {
  // Safety: only expose in dev (and optionally in preview)
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const store = __seedStore();

  return NextResponse.json({
    users: store.users,
    requests: store.requests,
    matches: store.matches,
  });
}
