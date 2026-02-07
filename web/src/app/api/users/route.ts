import { NextResponse } from "next/server";
import { usersCol } from "../../../../lib/db_types"; 
import { AllowedTags } from "../../../../lib/tags";
import { ObjectId } from "mongodb";


// export async function GET() {
//   try {
//     const users = await usersCol();

//     const data = await users
//       .find({})
//       .sort({ createdAt: -1 }) // newest first
//       .toArray();

//     return NextResponse.json({
//       ok: true,
//       data,
//     });
//   } catch (error) {
//     console.error("GET /api/users error:", error);

//     return NextResponse.json(
//       { ok: false, error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }


export async function POST(req: Request) {
  try {
    const body = await req.json();

    // basic validation
    if (!body.name) {
      return NextResponse.json(
        { ok: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const users = await usersCol();
    const now = new Date();
    const tags =
    Array.isArray(body.tags)
        ? body.tags.filter((t: string) => AllowedTags.includes(t as any))
        : [];

    const result = await users.insertOne({
    name: body.name,
    bio: body.bio ?? "",
    tags,
    timezone: body.timezone ?? "UTC",
    createdAt: now,
    updatedAt: now,
    });

    return NextResponse.json({
      ok: true,
      id: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("POST /api/users error:", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
