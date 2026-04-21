import { Server as HTTPServer } from "http";
import { Socket, Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins their notification room
    socket.on("join-user-room", (userId: string) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // User joins a chat room
    socket.on("join-chat", (chatId: string, userId: string) => {
      socket.join(`chat-${chatId}`);
      io?.to(`chat-${chatId}`).emit("user-joined", { userId, timestamp: new Date() });
    });

    // User leaves a chat room
    socket.on("leave-chat", (chatId: string, userId: string) => {
      socket.leave(`chat-${chatId}`);
      io?.to(`chat-${chatId}`).emit("user-left", { userId, timestamp: new Date() });
    });

    // Message sent
    socket.on("message-sent", (data: { chatId: string; messageId: string; senderId: string; content: string }) => {
      io?.to(`chat-${data.chatId}`).emit("new-message", data);
    });

    // Typing indicator
    socket.on("user-typing", (data: { chatId: string; userId: string }) => {
      socket.to(`chat-${data.chatId}`).emit("user-typing", { userId: data.userId });
    });

    socket.on("user-stopped-typing", (data: { chatId: string; userId: string }) => {
      socket.to(`chat-${data.chatId}`).emit("user-stopped-typing", { userId: data.userId });
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocket(): SocketIOServer | null {
  return io;
}

export function emitNotification(userId: string, notification: any) {
  if (io) {
    io.to(`user-${userId}`).emit("new-notification", notification);
  }
}

export function emitToChat(chatId: string, event: string, data: any) {
  if (io) {
    io.to(`chat-${chatId}`).emit(event, data);
  }
}
