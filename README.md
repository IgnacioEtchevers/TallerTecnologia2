# Entrega 1 - Panel con Wallet

App de React que se conecta a una wallet y lee datos de Sepolia (saldo ETH, bloque actual y saldos de 2 tokens ERC-20).

## Cómo correrlo

```bash
npm install
cp .env.example .env
# abrir el .env y pegar el VITE_WC_PROJECT_ID (se saca gratis en https://cloud.reown.com)
npm run dev
```

Después abrir http://localhost:5173, clickear "Conectar wallet" y en MetaMask pasar la red a Sepolia.

## Tokens ERC-20 usados (Sepolia)

- LINK: `0x779877A7B0D9E8603169DdbD7836e478b4624789`
- USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

Faucets que usé: https://faucets.chain.link/sepolia (LINK) y https://faucet.circle.com (USDC).

## Stack

React 18 + Vite + TypeScript, wagmi v2, viem, RainbowKit v2, @tanstack/react-query.
