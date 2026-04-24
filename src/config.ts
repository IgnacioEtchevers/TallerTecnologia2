import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, mainnet } from "wagmi/chains";
import { http } from "wagmi";

// mainnet es solo para resolver ENS, la app corre en Sepolia
export const wagmiConfig = getDefaultConfig({
  appName: "Entrega 1",
  projectId: import.meta.env.VITE_WC_PROJECT_ID || "",
  chains: [sepolia, mainnet],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
});
