import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { http } from "wagmi";

export const wagmiConfig = getDefaultConfig({
  appName: "Job Marketplace",
  projectId: import.meta.env.VITE_WC_PROJECT_ID || "",
  chains: [sepolia],
  transports: {
    // El Tablero lee eventos desde el bloque 0, y el plan free de Alchemy limita
    // eth_getLogs a 10 bloques. Por eso usamos por defecto un RPC sin ese limite
    // (Tenderly), con override por .env si se quiere otro.
    [sepolia.id]: http(
      import.meta.env.VITE_SEPOLIA_RPC_URL || "https://sepolia.gateway.tenderly.co"
    ),
  },
});
