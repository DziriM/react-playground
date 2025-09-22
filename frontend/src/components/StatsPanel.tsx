// frontend/src/components/StatsPanel.tsx
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as signalR from "@microsoft/signalr";

type StatsDto = {
  totalMessages: number;
  activeUsers: number;
  throughputPerMin: number;
};

async function fetchStats(): Promise<StatsDto> {
  try {
    const res = await fetch("/api/stats");
    if (!res.ok) throw new Error("Failed to fetch /api/stats");
    const json = await res.json();
    return {
      totalMessages: json.totalMessages ?? json.TotalMessages ?? 0,
      activeUsers: json.activeUsers ?? json.ActiveUsers ?? 0,
      throughputPerMin: json.throughputPerMin ?? json.ThroughputPerMin ?? 0,
    } as StatsDto;
  } catch (err) {
    console.warn("fetchStats error", err);
    return { totalMessages: 0, activeUsers: 0, throughputPerMin: 0 };
  }
}

export default function StatsPanel() {
  const queryClient = useQueryClient();
  const { data } = useQuery<StatsDto, Error>({
    queryKey: ["stats"],
    queryFn: fetchStats,
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/hub/stream")
      .withAutomaticReconnect()
      .build();

    connection.on("StatsUpdate", (payload: any) => {
      const stats: StatsDto = {
        totalMessages: payload.totalMessages ?? payload.TotalMessages ?? 0,
        activeUsers: payload.activeUsers ?? payload.ActiveUsers ?? 0,
        throughputPerMin:
          payload.throughputPerMin ?? payload.ThroughputPerMin ?? 0,
      };
      queryClient.setQueryData(["stats"], stats);
    });

    connection
      .start()
      .then(() => setConnected(true))
      .catch((err) => {
        console.error("SignalR connect error (StatsPanel)", err);
        setConnected(false);
      });

    return () => {
      connection.stop().catch(() => {});
    };
  }, [queryClient]);

  const s = data ?? { totalMessages: 0, activeUsers: 0, throughputPerMin: 0 };

  return (
    <div className="panel card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <h3 style={{ margin: 0 }}>Statistiques</h3>
        <small style={{ color: connected ? "#6fe3a1" : "#f08b8b" }}>
          {connected ? "realtime" : "offline"}
        </small>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="stat-row">
          <div className="stat-label">Messages total</div>
          <div className="stat-value">{s.totalMessages}</div>
        </div>

        <div className="stat-row">
          <div className="stat-label">Utilisateurs actifs</div>
          <div className="stat-value">{s.activeUsers}</div>
        </div>

        <div className="stat-row">
          <div className="stat-label">Débit (approx.)</div>
          <div className="stat-value">{s.throughputPerMin} / min</div>
        </div>
      </div>
    </div>
  );
}
