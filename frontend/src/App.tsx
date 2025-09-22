// frontend/src/App.tsx
import SignalStream from "./components/SignalStream";
import StatsPanel from "./components/StatsPanel";
import FrancePanel from "./components/FrancePanel";
import "./index.css";

export default function App() {
  return (
    <div className="app-root">
      <aside className="left-col">
        <StatsPanel />
        <FrancePanel />
      </aside>

      <main className="main-col">
        <header className="main-header">
          <h1>React Playground</h1>
          <p className="subtitle">
            Example of SignalR streaming + public APIs (EUR/USD, BTC/USD, France
            info)
          </p>
        </header>

        <section className="card">
          <h2 className="card-title">Message stream</h2>
          <SignalStream />
        </section>

        <section className="card muted" style={{ marginTop: 16 }}>
          <h2 className="card-title">Notes</h2>
          <p style={{ margin: 0 }}>
            Stream delivered from your backend via SignalR (ReceiveMessage +
            StatsUpdate). Public APIs polled periodically (see left panel).
          </p>
        </section>
      </main>

      <div className="right-col" />
    </div>
  );
}
