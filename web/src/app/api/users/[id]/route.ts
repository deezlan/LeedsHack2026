import { NextResponse } from "next/server";
import { usersCol } from "../../../../../lib/db_types";
import { ObjectId } from "mongodb";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {

    const { id } = await params;

    // validate id
    // if (!ObjectId.isValid(id)) {
    //   return NextResponse.json(
    //     { ok: false, error: "Invalid user id" },
    //     { status: 400 }
    //   );
    // }

    // Better validation - check length and hex format
    if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid user id" },
        { status: 400 }
      );
    }

    const users = await usersCol();

    // find ONE user
    const doc = await users.findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // convert DB → API
    return NextResponse.json({
      ok: true,
      data: {
        id: doc._id!.toString(),
        name: doc.name,
        bio: doc.bio,
        tags: doc.tags,
        timezone: doc.timezone,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("GET /api/users/:id error:", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

