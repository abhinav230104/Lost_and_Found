import { cookies } from "next/headers";
import { verifyToken, type TokenPayload } from "./auth";

export async function getUserFromToken(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  const decoded = verifyToken(token);

  return decoded || null;
}