// frontend/src/components/SignalStream.tsx
import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";

type Msg = { id: string; text?: string };

export default function SignalStream() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/hub/stream")
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (msg: any) => {
      // normalize message shape
      const m: Msg = {
        id: msg?.id ?? msg ?? String(Date.now()),
        text: msg?.text ?? (typeof msg === "string" ? msg : undefined),
      };
      setMessages((prev) => [m, ...prev].slice(0, 200)); // keep recent 200
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <small style={{ color: "#999" }}>Status:</small>
          <strong style={{ color: connected ? "#6fe3a1" : "#f08b8b" }}>
            {connected ? "connected" : "disconnected"}
          </strong>
        </div>
        <small style={{ color: "#bbb" }}>Showing most recent messages</small>
      </div>

      <div className="stream-box">
        {messages.length === 0 && (
          <div className="muted">
            No messages yet — waiting for server events...
          </div>
        )}

        {messages.map((m) => (
          <div className="stream-row" key={m.id}>
            <div className="stream-id">#{m.id.slice(0, 8)}</div>
            <div className="stream-text">
              {m.text ?? <em style={{ color: "#888" }}>[no content]</em>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
