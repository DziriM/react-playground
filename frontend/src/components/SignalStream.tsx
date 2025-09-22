import React, { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";

type Msg = { id: number; text: string };

export default function SignalStream() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/hub/stream") // thanks to vite proxy this becomes http://localhost:5000/hub/stream
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (msg: Msg) => {
      setMessages((prev) => [msg, ...prev].slice(0, 50));
    });

    connection
      .start()
      .then(() => setConnected(true))
      .catch((err) => {
        console.error("SignalR connection error", err);
        setConnected(false);
      });

    return () => {
      connection.stop().catch(() => {});
    };
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <strong>SignalR status:</strong>{" "}
        {connected ? "connected" : "disconnected"}
      </div>
      <div
        style={{
          maxHeight: 300,
          overflow: "auto",
          border: "1px solid #ddd",
          padding: 8,
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{ padding: "6px 0", borderBottom: "1px solid #f2f2f2" }}
          >
            <small style={{ color: "#666" }}>#{m.id}</small>{" "}
            <span>{m.text}</span>
          </div>
        ))}
        {messages.length === 0 && (
          <div style={{ color: "#888" }}>No messages yet.</div>
        )}
      </div>
    </div>
  );
}
