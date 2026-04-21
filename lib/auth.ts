import jwt from "jsonwebtoken";

function getSecret() {
  return process.env.JWT_SECRET;
}

export type TokenPayload = {
  userId: string;
  iat?: number;
  exp?: number;
};

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export function generateToken(userId: string) {
  const secret = getSecret();
  if (!secret) {
    throw new Error("Missing JWT_SECRET environment variable");
  }

  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const secret = getSecret();
    if (!secret) {
      return null;
    }

    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    return null;
  }
}