import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/getUser";

// =======================
// POST → Send Message
// =======================
export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { chatId, content } = body;

    if (!chatId || !content) {
      return NextResponse.json(
        { error: "chatId and content are required" },
        { status: 400 }
      );
    }

    // Check chat exists
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        claim: {
          include: { item: true },
        },
      },
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }

    // Check access
    const isOwner = chat.claim.item.userId === user.userId;
    const isClaimant = chat.claim.userId === user.userId;

    if (!isOwner && !isClaimant) {
      return NextResponse.json(
        { error: "Not allowed" },
        { status: 403 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        chatId,
        senderId: user.userId,
      },
      include: {
        sender: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message,
    });

  } catch (error: any) {
    console.error("SEND MESSAGE ERROR:", error.message, error);

    return NextResponse.json(
      { error: "Internal error", details: error.message },
      { status: 500 }
    );
  }
}


// =======================
// GET → Fetch Messages
// =======================
export async function GET(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { error: "chatId is required" },
        { status: 400 }
      );
    }

    // Check chat exists
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        claim: {
          include: { item: true },
        },
      },
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }

    // Check access
    const isOwner = chat.claim.item.userId === user.userId;
    const isClaimant = chat.claim.userId === user.userId;

    if (!isOwner && !isClaimant) {
      return NextResponse.json(
        { error: "Not allowed" },
        { status: 403 }
      );
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: { chatId },
      include: {
        sender: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      messages,
    });

  } catch (error: any) {
    console.error("GET MESSAGES ERROR:", error.message, error);

    return NextResponse.json(
      { error: "Internal error", details: error.message },
      { status: 500 }
    );
  }
}