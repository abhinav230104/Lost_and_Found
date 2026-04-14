"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";

export default function TestSocket() {
  useEffect(() => {
    const socket = io("http://localhost:4000");

    socket.on("connect", () => {
      console.log("Connected:", socket.id);

      socket.emit("join_chat", "test-room");

      socket.emit("send_message", {
        chatId: "test-room",
        text: "Hello from client",
      });
    });

    socket.on("receive_message", (msg) => {
      console.log("Received:", msg);
    });

    return () => {
      socket.disconnect();
    };

  }, []);

  return <div>Socket Test Running</div>;
}