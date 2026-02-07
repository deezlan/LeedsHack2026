import { NextResponse } from "next/server";
import { usersCol } from "../../../../../lib/db_types"; 
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const users = await usersCol();

    const data = await users
      .find({})
      .sort({ createdAt: -1 }) // newest first
      .toArray();

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("GET /api/users error:", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
