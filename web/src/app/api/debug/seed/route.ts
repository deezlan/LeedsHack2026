import { NextResponse } from "next/server";
import { usersCol, requestsCol } from "@/lib/db_types";
import usersSeed from "@/seed/users.json";
import requestsSeed from "@/seed/requests.json";
import { AllowedTags } from "@/lib/tags";

function toAllowedTags(tags: any) {
  const arr = Array.isArray(tags) ? tags : [];
  return arr.filter((t) => AllowedTags.includes(t));
}

export async function POST() {
  try {
    const users = await usersCol();
    const requests = await requestsCol();

    // Seed users
    for (const u of usersSeed as any[]) {
      const now = new Date();
      await users.updateOne(
        { username: u.username },
        {
          $setOnInsert: {
            username: u.username,
            name: u.name,
            bio: u.bio ?? "",
            tags: toAllowedTags(u.tags),
            timezone: u.timezone ?? "UTC",
            createdAt: now,
            updatedAt: now,
          },
        },
        { upsert: true }
      );
    }

    // OPTIONAL: seed requests too (only if you want)
    for (const r of requestsSeed as any[]) {
      // find requester by username if your seed has it; otherwise skip
      // If your seed requests already have requesterId as string, you’ll need mapping.
      // You can leave requests seeding out for now.
    }

    const count = await users.countDocuments();
    return NextResponse.json({ ok: true, users: count });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "seed failed" }, { status: 500 });
  }
}
