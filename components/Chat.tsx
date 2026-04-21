"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function Chat({ chatId }: { chatId: string }) {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (socketRef.current) return;
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  // =========================
  // Load messages from DB
  // =========================
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/chats/${chatId}`, {
          credentials: "include", // FIX 1
        });

        const data = await res.json();

        if (!data.messages) {
          console.log("API ERROR:", data); // FIX 2
          return;
        }

        const oldMessages = data.messages.map((m: any) => m.content);
        setMessages(oldMessages);

      } catch (err) {
        console.error("LOAD MESSAGE ERROR:", err);
      }
    };

    loadMessages();
  }, [chatId]);

  // =========================
  // Socket setup
  // =========================
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("join_chat", chatId);

    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data.text]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [chatId]);

  // =========================
  // Send message
  // =========================
  const sendMessage = async () => {
    if (!input) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // FIX 1
        body: JSON.stringify({
          chatId,
          content: input,
        }),
      });

      const data = await res.json();
      console.log("API response:", data);

      if (!res.ok) {
        console.log("API FAILED:", data);
        return;
      }

      const socket = socketRef.current;
      if (!socket) return;

      socket.emit("send_message", {
        chatId,
        text: input,
      });

      setInput("");

    } catch (err) {
      console.error("SEND MESSAGE ERROR:", err);
    }
  };

  return (
    <div>
      <h2>Chat</h2>

      <div>
        {messages.map((msg, i) => (
          <p key={i}>{msg}</p>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}