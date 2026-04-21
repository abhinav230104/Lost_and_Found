import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/getUser";

export async function GET(req: Request) {
  try {
    const userToken = await getUserFromToken();

    if (!userToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const chats = await prisma.chat.findMany({
      where: {
        claim: {
          OR: [
            { userId: userToken.userId },
            { item: { userId: userToken.userId } },
          ],
        },
      },
      include: {
        claim: {
          select: {
            id: true,
            status: true,
            userId: true,
            user: {
              select: { name: true }
            },
            item: {
              select: {
                id: true,
                title: true,
                userId: true,
                user: {
                  select: { name: true }
                }
              },
            },
          },
        },
        messages: {
          select: { id: true, createdAt: true, senderId: true, content: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      count: chats.length,
      chats,
    });
  } catch (error) {
    console.error("GET CHATS ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
