import { NextResponse } from "next/server";
import { usersCol } from "../../../../lib/db_types";
import { AllowedTags } from "../../../../lib/tags";

function slugifyUsername(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}

export async function GET() {
  try {
    const users = await usersCol();

    const data = await users.find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      users: data.map((u: any) => {
        const createdAt = u.createdAt?.toISOString?.() ?? "";
        const updatedAt = u.updatedAt?.toISOString?.() ?? createdAt;

        return {
          id: u._id?.toString?.() ?? "",
          username: u.username ?? "",
          name: u.name ?? "",
          bio: u.bio ?? "",
          tags: Array.isArray(u.tags) ? u.tags : [],
          timezone: u.timezone ?? "UTC",
          createdAt,
          updatedAt,
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { ok: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const now = new Date();

    const tags = Array.isArray(body.tags)
      ? body.tags.filter((t: string) => AllowedTags.includes(t as any))
      : [];

    // Ensure username exists (db_types.ts expects username: string)
    const username =
      typeof body.username === "string" && body.username.trim()
        ? body.username.trim()
        : slugifyUsername(body.name) || `user_${now.getTime()}`;

    const doc = {
      username,
      name: body.name.trim(),
      bio: typeof body.bio === "string" ? body.bio : "",
      tags,
      timezone: typeof body.timezone === "string" ? body.timezone : "UTC",
      createdAt: now,
      updatedAt: now,
    };

    const users = await usersCol();
    const result = await users.insertOne(doc as any);

    // IMPORTANT: lib/api.ts expects { user }
    const user = {
      id: result.insertedId.toString(),
      ...doc,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
