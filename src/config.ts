import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, mainnet } from "wagmi/chains";
import { http } from "wagmi";

// mainnet va solo por si alguna wallet resuelve ENS desde ahi
export const wagmiConfig = getDefaultConfig({
  appName: "Multisig - Entrega 2",
  projectId: import.meta.env.VITE_WC_PROJECT_ID || "",
  chains: [sepolia, mainnet],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
});
