import { NextResponse } from "next/server";
import { matchesCol } from "../../../../../../lib/db_types";
import { ObjectId } from "mongodb";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;

    if (!ObjectId.isValid(requestId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid requestId" },
        { status: 400 }
      );
    }

    const col = await matchesCol();

    const matches = await col
      .find({ requestId: new ObjectId(requestId) })
      .sort({ score: -1 })
      .toArray();

    return NextResponse.json({
      ok: true,
      data: matches.map((m) => ({
        ...m,
        _id: m._id?.toString(),
        requestId: m.requestId.toString(),
        requesterId: m.requesterId.toString(),
        helperId: m.helperId.toString(),
      })),
    });
  } catch (err) {
    console.error("GET /api/matches/by-request error:", err);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
