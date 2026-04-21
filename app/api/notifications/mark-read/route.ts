import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/getUser";

export async function PATCH(req: Request) {
  try {
    const userToken = await getUserFromToken();

    if (!userToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: userToken.userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({
      message: "Notifications marked as read",
      count: result.count,
    });
  } catch (error) {
    console.error("MARK ALL READ ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
