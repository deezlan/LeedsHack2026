import { NextResponse } from "next/server";
import { requestsCol } from "../../../../lib/db_types";
import { AllowedTags } from "../../../../lib/tags";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const requests = await requestsCol();

    const data = await requests
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      ok: true,
      data: data.map((r) => ({
        id: r._id!.toString(),
        requesterId: r.requesterId.toString(),
        title: r.title,
        description: r.description,
        urgency: r.urgency,
        format: r.format,
        tags: r.tags,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/requests error:", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.requesterId || !body.title || !body.description) {
      return NextResponse.json(
        { ok: false, error: "requesterId, title, description are required" },
        { status: 400 }
      );
    }

    const tags =
      Array.isArray(body.tags)
        ? body.tags.filter((t: string) => AllowedTags.includes(t as any))
        : [];

    const now = new Date();
    const reqs = await requestsCol();

    const result = await reqs.insertOne({
      requesterId: new ObjectId(body.requesterId),
      title: body.title,
      description: body.description,
      urgency: body.urgency ?? "medium",
      format: body.format ?? "async",
      tags,
      createdAt: now,
      updatedAt: now,
    } as any);

    return NextResponse.json({
      ok: true,
      id: result.insertedId.toString(),
    });
  } catch (e) {
    console.error("POST /api/requests error:", e);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
