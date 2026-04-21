import { NextResponse } from "next/server";
import { authCookieOptions } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out" });

  res.cookies.set("token", "", {
    ...authCookieOptions,
    expires: new Date(0),
  });

  return res;
}