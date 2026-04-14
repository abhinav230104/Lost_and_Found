const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
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

server.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});