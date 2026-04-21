import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const userName = searchParams.get("name");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!userName || userName.trim().length < 2) {
      return NextResponse.json(
        { error: "User name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          name: {
            contains: userName,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          items: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({
        where: {
          name: {
            contains: userName,
            mode: "insensitive",
          },
        },
      }),
    ]);

    return NextResponse.json({
      total,
      count: users.length,
      users,
      offset,
      limit,
    });
  } catch (error) {
    console.error("SEARCH USERS ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
