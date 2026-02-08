import { NextResponse } from "next/server";
import { devUsers, normalizeEmail } from "@/lib/devUserStore";

type LoginBody = { email?: string; password?: string };

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  let body: LoginBody = {};
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";

  if (!email || !password) return jsonError("Email and password required.", 400);

  const user = devUsers.get(email);
  if (!user || user.password !== password) {
    return jsonError("Invalid email or password.", 401);
  }

  const session = {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    token: `token_${user.id}`,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ ok: true, session }, { status: 200 });
}
