import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const recentlyClosed = await prisma.item.findMany({
      where: {
        status: "CLOSED",
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
        claims: {
          where: {
            status: "approved",
          },
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      count: recentlyClosed.length,
      items: recentlyClosed,
    });
  } catch (error) {
    console.error("RESOLVED ITEMS ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
