import type { Address } from "viem";

// La address del contrato desplegado se carga desde el .env (VITE_MULTISIG_ADDRESS)
export const MULTISIG_ADDRESS = (import.meta.env.VITE_MULTISIG_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as Address;

// Entrega Final - Job Marketplace
export const MARKETPLACE_ADDRESS = (import.meta.env.VITE_MARKETPLACE_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as Address;
// Token de pago: LINK en Sepolia (mismo que usaba el panel de la Entrega 1)
export const TOKEN_ADDRESS = (import.meta.env.VITE_TOKEN_ADDRESS ||
  "0x779877A7B0D9E8603169DdbD7836e478b4624789") as Address;
