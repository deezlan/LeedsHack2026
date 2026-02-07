import { NextResponse } from "next/server";
import { matchesCol } from "../../../../../lib/db_types";
import { ObjectId } from "mongodb";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ helperId: string }> }
) {
  try {
    const { helperId } = await params;

    if (!ObjectId.isValid(helperId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid helperId" },
        { status: 400 }
      );
    }

    const col = await matchesCol();

    const inbox = await col
      .find({
        helperId: new ObjectId(helperId),
        state: "requested",
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      ok: true,
      data: inbox.map((m) => ({
        ...m,
        _id: m._id?.toString(),
        requestId: m.requestId.toString(),
        requesterId: m.requesterId.toString(),
        helperId: m.helperId.toString(),
      })),
    });
  } catch (err) {
    console.error("GET /api/inbox error:", err);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
