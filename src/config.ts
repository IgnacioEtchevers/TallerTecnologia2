// config de wagmi + rainbowkit
// mainnet lo dejo solo para que resuelva el ENS, la app en sí corre en Sepolia
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, mainnet } from "wagmi/chains";
import { http } from "wagmi";

const wcId = import.meta.env.VITE_WC_PROJECT_ID ?? "";

export const wagmiConfig = getDefaultConfig({
  appName: "Entrega 1",
  projectId: wcId || "placeholder", // TODO: poner el real en el .env
  chains: [sepolia, mainnet],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
});
