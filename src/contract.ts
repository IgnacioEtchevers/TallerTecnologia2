import type { Address } from "viem";

// La address del contrato desplegado se carga desde el .env (VITE_MULTISIG_ADDRESS)
export const MULTISIG_ADDRESS = (import.meta.env.VITE_MULTISIG_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as Address;
