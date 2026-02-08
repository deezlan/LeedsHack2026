import { NextResponse } from "next/server";
import { requestsCol } from "../../../../../lib/db_types";
import { ObjectId } from "mongodb";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; 

    const col = await requestsCol();

    const doc = await col.findOne({
      _id: new ObjectId(id),
    });

    if (!doc) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: doc,
    });
  } catch (error) {
    console.error("GET /api/requests/:id error:", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
