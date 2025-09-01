import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({ password: "" }));
  const expected = process.env.ADMIN_PASSWORD || "";

  if (!expected) {
    return NextResponse.json({ error: "Admin password not configured" }, { status: 500 });
  }

  if (password !== expected) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  // Set httpOnly cookie for admin session; expires in 12 hours
  const expires = new Date(Date.now() + 12 * 60 * 60 * 1000);
  res.cookies.set("sdftc_admin_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return res;
}
