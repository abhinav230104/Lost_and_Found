import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/getUser";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await context.params;

    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find chat using claimId
    const chat = await prisma.chat.findUnique({
      where: { claimId },
      include: {
        claim: {
          include: { item: true },
        },
        messages: {
          include: {
            sender: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }

    // Access control
    const isOwner = chat.claim.item.userId === user.userId;
    const isClaimant = chat.claim.userId === user.userId;

    if (!isOwner && !isClaimant) {
      return NextResponse.json(
        { error: "Not allowed" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      chatId: chat.id, // useful for frontend
      messages: chat.messages,
    });

  } catch (error) {
    console.error("GET CHAT ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}