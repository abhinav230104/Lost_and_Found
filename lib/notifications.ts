import { prisma } from "@/lib/db";

export async function createNotification(
  userId: string,
  type: "claim_submitted" | "claim_approved" | "claim_rejected" | "new_message" | "item_closed",
  title: string,
  message: string,
  relatedItemId?: string,
  relatedClaimId?: string
) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        relatedItemId,
        relatedClaimId,
      },
    });
  } catch (error) {
    console.error("CREATE NOTIFICATION ERROR:", error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  } catch (error) {
    console.error("UPDATE NOTIFICATION READ ERROR:", error);
    throw error;
  }
}

export async function getUserNotifications(userId: string, unreadOnly: boolean = false) {
  try {
    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    return await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } catch (error) {
    console.error("GET USER NOTIFICATIONS ERROR:", error);
    throw error;
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    return await prisma.notification.delete({
      where: { id: notificationId },
    });
  } catch (error) {
    console.error("DELETE NOTIFICATION ERROR:", error);
    throw error;
  }
}
