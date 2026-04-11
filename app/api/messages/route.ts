import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/getUser";

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { chatId, content } = await req.json();

    if (!chatId || !content) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    //Check chat exists
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

    //Check user is part of chat
    const isOwner = chat.claim.item.userId === user.userId;
    const isClaimant = chat.claim.userId === user.userId;

    if (!isOwner && !isClaimant) {
      return NextResponse.json(
        { error: "Not allowed" },
        { status: 403 }
      );
    }

    //Create message
    const message = await prisma.message.create({
      data: {
        content,
        chatId,
        senderId: user.userId,
      },
    });

    return NextResponse.json({
      message: "Message sent",
      data: message,
    });

  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

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

    // Get messages
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
      messages,
    });

  } catch (error) {
    console.error("GET MESSAGES ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}