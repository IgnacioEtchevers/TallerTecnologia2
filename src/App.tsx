import { useState } from "react";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Dashboard } from "./components/Dashboard";
import { JobDetail } from "./components/JobDetail";

type View = 
  | {name: "dashboard"}
  | {name: "detail"; jobId: bigint}
  | {name: "publish"}

export default function App() {
  const { isConnected } = useAccount();
  const [view, setView] = useState<View>({ name: "dashboard" });

  if (!isConnected) {
    return (
      <div className="hero">
        <h1>Job Marketplace</h1>
        <p>Conectá tu wallet en Sepolia para ver y operar el marketplace.</p>
        <ConnectButton label="Conectar wallet" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="top">
        <h1>Job Marketplace</h1>
        <ConnectButton />
      </div>

      <nav className="acciones">
        <button onClick={() => setView({ name: "dashboard" })}>Tablero</button>
        <button onClick={() => setView({ name: "publish" })}>Publicar trabajo</button>
      </nav>

      {view.name === "dashboard" && (
        <Dashboard onOpenJob={(id) => setView({ name: "detail", jobId: id })} />
      )}
      {view.name === "detail" && (
        <JobDetail jobId={view.jobId} onBack={() => setView({ name: "dashboard" })} />
      )}
      {view.name === "publish" && <p>Publicar Trabajo</p>}
    </div>
  );
}