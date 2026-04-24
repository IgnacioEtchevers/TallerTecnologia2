import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Cuenta } from "./components/Cuenta";
import { Tokens } from "./components/Tokens";

export default function App() {
  const { isConnected } = useAccount();

  // si no hay wallet conectada, solamente mostramos el botón y nada más
  if (!isConnected) {
    return (
      <div className="hero">
        <h1>Entrega 1 — Panel con Wallet</h1>
        <p>Conectá tu wallet para ver tu cuenta en Sepolia.</p>
        <ConnectButton label="Conectar wallet" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="top">
        <h1>Mi Wallet</h1>
        <ConnectButton />
      </div>
      <Cuenta />
      <Tokens />
    </div>
  );
}
