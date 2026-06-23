import type { Address } from "viem";

// Multisig de la Entrega 2 (se usa como evaluador). Se carga del .env.
export const MULTISIG_ADDRESS = (import.meta.env.VITE_MULTISIG_ADDRESS ||
  "0xfe39aed085e9093ccac10b8c90aa2bb6abf1496e") as Address;

// Address del JobMarketplace desplegado en Sepolia. Se puede sobreescribir por .env
// (VITE_MARKETPLACE_ADDRESS); el default es nuestro deploy para que ande al clonar.
export const MARKETPLACE_ADDRESS = (import.meta.env.VITE_MARKETPLACE_ADDRESS ||
  "0x21692bdbb7a969fa01966cfd8c0c74a38cc03f7a") as Address;

// Token de pago: LINK en Sepolia (el mismo que leía el panel de la Entrega 1).
export const TOKEN_ADDRESS = (import.meta.env.VITE_TOKEN_ADDRESS ||
  "0x779877A7B0D9E8603169DdbD7836e478b4624789") as Address;
