const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
const allowedOrigins = frontendUrl
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

function normalizeOrigin(origin) {
  return origin.trim().replace(/\/$/, "");
}

function isAllowedOrigin(origin) {
  // Requests without Origin (curl, health checks, some server-to-server calls).
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalizedOrigin)) return true;

  // Allow Vercel preview/production domains when explicitly enabled.
  if (process.env.ALLOW_VERCEL_ORIGINS === "true") {
    return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalizedOrigin);
  }

  return false;
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
};

app.use(
  cors(corsOptions)
);

app.get("/", (_req, res) => {
  res.status(200).send("Socket server is running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // New frontend event style
  socket.on("join-chat", (chatId) => {
    socket.join(`chat-${chatId}`);
    console.log("Joined chat:", `chat-${chatId}`);
  });

  socket.on("leave-chat", (chatId) => {
    socket.leave(`chat-${chatId}`);
    console.log("Left chat:", `chat-${chatId}`);
  });

  socket.on("message-sent", (data) => {
    if (!data?.chatId) return;
    io.to(`chat-${data.chatId}`).emit("new-message", data);
  });

  // Legacy event style kept for backward compatibility
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log("Joined chat:", chatId);
  });

  // receive message
  socket.on("send_message", (data) => {
    if (!data?.chatId) return;
    console.log("Message:", data);

    io.to(data.chatId).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});