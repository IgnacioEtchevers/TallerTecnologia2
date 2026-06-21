import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { http } from "wagmi";

export const wagmiConfig = getDefaultConfig({
  appName: "Job Marketplace",
  projectId: import.meta.env.VITE_WC_PROJECT_ID || "",
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
});
