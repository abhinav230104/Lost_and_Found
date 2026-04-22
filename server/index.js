const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

app.get("/", (_req, res) => {
  res.status(200).send("Socket server is running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // join room
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log("Joined chat:", chatId);
  });

  // receive message
  socket.on("send_message", (data) => {
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