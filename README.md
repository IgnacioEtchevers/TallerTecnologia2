# Entrega 1 — Panel con Wallet

App de React + wagmi que se conecta a una wallet y lee datos de Sepolia.

## Cómo correrlo

```bash
npm install
cp .env.example .env   # y pegá tu Project ID de WalletConnect en VITE_WC_PROJECT_ID
npm run dev
```

Abrir http://localhost:5173, dar "Conectar wallet" (yo probé con MetaMask) y cambiar la red a **Sepolia**.

El Project ID se saca gratis en https://cloud.reown.com/ (es lo que antes era cloud.walletconnect.com).

## Tokens ERC-20 usados (Sepolia)

- **LINK** → `0x779877A7B0D9E8603169DdbD7836e478b4624789`
- **USDC** → `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

(Para conseguir algo de saldo: https://faucets.chain.link/sepolia y https://faucet.circle.com)

## Qué hace

- Si la wallet no está conectada → solo muestra el botón de conectar, nada más.
- Si está conectada:
  - Panel de Cuenta con el ENS (o la dirección acortada si no tiene), el saldo de ETH a 4 decimales, y el número de bloque actualizándose en vivo (uso `useBlockNumber({ watch: true })`).
  - Panel de Tokens con los 2 ERC-20. De cada uno leo `name()`, `symbol()`, `decimals()` y `balanceOf(address)` con `useReadContracts` en un solo batch.
- Desconectar y reconectar se hace desde el mismo botón de RainbowKit.

## Stack

- Vite + React 18
- TypeScript (sin `any`)
- wagmi v2 + viem
- RainbowKit v2
- @tanstack/react-query

## Scripts útiles

```bash
npm run typecheck   # tsc --noEmit
npm run build       # build de producción
```

## Estructura

```
src/
├── main.tsx        # providers
├── App.tsx         # gatea por conexión
├── config.ts       # config de wagmi + rainbowkit
├── abis.ts         # abi mínimo del ERC-20
├── styles.css
└── components/
    ├── Cuenta.tsx  # ENS / saldo ETH / bloque
    └── Tokens.tsx  # los 2 tokens ERC-20
```
