import { NextResponse } from "next/server";
import { devUsers, normalizeEmail } from "@/lib/devUserStore";

type SignupBody = { email?: string; password?: string; displayName?: string };

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  let body: SignupBody = {};
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";
  const displayName = (body.displayName ?? "").trim();

  if (!email) return jsonError("Email is required.", 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return jsonError("Enter a valid email address.", 400);
  if (password.length < 6)
    return jsonError("Password must be at least 6 characters.", 400);
  if (!displayName) return jsonError("Display name is required.", 400);

  if (devUsers.has(email)) return jsonError("Email already exists.", 409);

  const user = {
    id: `u_${Math.random().toString(36).slice(2, 10)}`,
    email,
    password,
    displayName,
  };

  devUsers.set(email, user);

  const session = {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    token: `token_${user.id}`,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ ok: true, session }, { status: 200 });
}
