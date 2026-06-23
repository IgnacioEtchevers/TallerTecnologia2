# Entrega Final - Job Marketplace

Marketplace de trabajos sobre Ethereum con escrow, inspirado en ERC-8183. Cada trabajo tiene
un cliente (publica y paga), un proveedor (entrega) y un evaluador (libera el pago o
reembolsa). El evaluador puede ser una wallet común o un contrato; si es el Multisig de la
Entrega 2, hacen falta M de N firmas para liberar el pago.

El flujo de un trabajo es `Open → Funded → Submitted → Completed`, con dos salidas
alternativas: `Rejected` (se reembolsa al cliente) y `Expired` (si se vence el plazo,
cualquiera puede reclamar el reembolso). Cualquier transición inválida revierte.

## Stack

- Solidity 0.8.20 + Hardhat (`hardhat-toolbox-viem`).
- React 18 + Vite + TypeScript.
- wagmi v2 + viem + RainbowKit v2.

## Cómo correr los tests

```
npm install
npx hardhat test
```

Los tests están en `test/JobMarketplace.test.ts` y cubren el happy path (crear → fondear →
entregar → completar), los rechazos (cliente en `Open`, evaluador en `Funded` y en
`Submitted`), la expiración (`claimRefund` desde `Funded` y desde `Submitted`), el control de
acceso de cada función, y el caso del Multisig como evaluador: desplegamos el Multisig de la
Entrega 2, lo ponemos como evaluador y mostramos que `complete` solo pasa cuando junta el
threshold y ejecuta.

## Cómo correr el frontend

```
npm install
cp .env.example .env
npm run dev
```

Abrir `http://localhost:5173` y conectar MetaMask en Sepolia. Hay tres pantallas: el Tablero
(lista los trabajos leyendo los eventos `JobCreated`), el Detalle (muestra todo el trabajo y
los botones según el rol de la wallet conectada) y Publicar (formulario que llama a
`createJob`).

### .env

```
SEPOLIA_RPC_URL=...        # RPC para tests y deploy (usamos Alchemy)
DEPLOYER_PRIVATE_KEY=...   # wallet con la que se deploya
VITE_WC_PROJECT_ID=...     # de cloud.reown.com
VITE_MARKETPLACE_ADDRESS=0x21692bdbb7a969fa01966cfd8c0c74a38cc03f7a
VITE_TOKEN_ADDRESS=0x779877A7B0D9E8603169DdbD7836e478b4624789
VITE_SEPOLIA_RPC_URL=      # opcional; si se deja vacío usa un RPC público (Tenderly)
```

## Deploy a Sepolia

```
npx hardhat run scripts/deployMarketplace.ts --network sepolia
```

Lee la address del token (LINK) del `.env` y deja el JobMarketplace apuntando a ese token.
Imprime la address del contrato para copiar a `VITE_MARKETPLACE_ADDRESS`.

## Direcciones en Sepolia

- JobMarketplace: `0x21692bdbb7a969fa01966cfd8c0c74a38cc03f7a`
- Multisig (Entrega 2, usado como evaluador): `0xfe39aed085e9093ccac10b8c90aa2bb6abf1496e`
- Token de pago (LINK): `0x779877A7B0D9E8603169DdbD7836e478b4624789`

Como token de pago usamos LINK de Sepolia, el mismo que ya leía el panel de la Entrega 1. Se
consigue gratis en el faucet de Chainlink (faucets.chain.link/sepolia).

## Decisiones de diseño

Algunas cosas que decidimos y por qué:

- El token de pago se fija en el constructor y no se puede cambiar, igual que hicimos con los
  signers del Multisig. Nos pareció más fácil de auditar.
- No usamos OpenZeppelin. Hicimos una interfaz mínima de ERC-20 y un lock anti-reentrancy a
  mano, para mantener el contrato chico como en la Entrega 2. Asumimos que el token devuelve
  `bool` en `transfer`/`transferFrom`, cosa que LINK cumple.
- Usamos custom errors en vez de `require` con strings, porque lo pide la consigna y además
  gastan menos gas (en la Entrega 2 habíamos usado strings).
- La descripción del trabajo no la guardamos on-chain, va solo en el evento `JobCreated` y el
  Tablero la lee de ahí. Guardar strings on-chain es caro.
- `claimRefund` no tiene control de acceso ni el lock, porque la consigna pide que nunca se
  pueda bloquear. En vez del lock usamos CEI: cambiamos el estado a `Expired` antes de
  transferir, así si el token intentara reentrar cae en `WrongStatus`. Las que sí usan el lock
  son `fund`, `complete` y `reject`.
- El contenido del entregable se guarda en `localStorage` y on-chain va solo el hash. El
  evaluador lo ve en el Detalle si está en el mismo navegador, que es la opción que la
  consigna marca como suficiente.

## Desvíos

- El `MockERC20` lo usamos solo para los tests (tiene un mint abierto para poder darse
  fondos). No es el token real; en Sepolia el pago es en LINK.
- El front usa un RPC de Tenderly por defecto para leer los eventos, porque el plan free de
  Alchemy limita `eth_getLogs` a 10 bloques y el Tablero lee desde el bloque 0. Se puede
  cambiar con `VITE_SEPOLIA_RPC_URL`.
