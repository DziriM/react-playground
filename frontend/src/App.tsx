import SignalStream from "./components/SignalStream";

export default function App() {
  return (
    <main style={{ fontFamily: "Inter, Arial, sans-serif", padding: 24 }}>
      <h1>React Playground</h1>
      <p>Example of SignalR streaming + simple REST fetch</p>
      <SignalStream />
    </main>
  );
}
