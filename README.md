# Entrega Final - Job Marketplace

Marketplace de empleos sobre Ethereum con escrow, inspirado en ERC-8183 (Agentic
Commerce Protocol). Cada trabajo tiene tres roles: **cliente** (publica y paga),
**proveedor** (entrega) y **evaluador** (libera el pago o reembolsa). El evaluador puede
ser una persona o **otro contrato** — por ejemplo el Multisig de la Entrega 2, lo que da
aprobación M-de-N sin código extra.

## Stack

- Solidity 0.8.20 + Hardhat (`@nomicfoundation/hardhat-toolbox-viem`).
- React 18 + Vite + TypeScript.
- wagmi v2 + viem + RainbowKit v2.

## Contratos

- `contracts/JobMarketplace.sol` — el marketplace con escrow.
- `contracts/Multisig.sol` — el Multisig de la Entrega 2, reusado como evaluador.
- `contracts/MockERC20.sol` — token ERC-20 mínimo para tests y pruebas locales.

### Máquina de estados de un Job

```
Open ──fund──> Funded ──submit──> Submitted ──complete──> Completed
 │                │                   │
 │ reject          │ reject            │ reject            (todas pasan a Rejected y
 │ (cliente)       │ (evaluador)       │ (evaluador)        reembolsan al cliente)
 ▼                ▼                   ▼
Rejected        Rejected           Rejected

Funded / Submitted, si block.timestamp > expiresAt ──claimRefund──> Expired
```

## Cómo correr los tests

```
npm install
npx hardhat compile
npx hardhat test
```

La suite (`test/JobMarketplace.test.ts`) cubre:

- **Happy path**: crear → fondear → entregar → completar (el proveedor cobra).
- **Rechazo**: cliente rechaza en `Open`; evaluador rechaza en `Funded`; evaluador
  rechaza en `Submitted` (en los dos últimos se reembolsa al cliente).
- **Expiración**: `claimRefund` funciona desde `Funded` y desde `Submitted`, y revierte
  si todavía no expiró.
- **Control de acceso**: cada función restringida (`setProvider`, `fund`, `submit`,
  `complete`, `reject`) llamada por la dirección incorrecta revierte.
- **Multisig como evaluador**: se despliega el Multisig de la Entrega 2, se asigna como
  evaluador de un job, y se demuestra que `complete` solo tiene éxito después de que el
  Multisig alcanza el threshold y ejecuta el llamado (un signer suelto llamando `complete`
  directo revierte con `NotEvaluator`).

## Cómo correr el frontend localmente

```
npm install
cp .env.example .env     # y completar las variables (ver abajo)
npm run dev
```

Abrir `http://localhost:5173` y conectar MetaMask en Sepolia.

### Variables de entorno

```
SEPOLIA_RPC_URL=https://...         # RPC (Alchemy/Infura), para tests y deploy
DEPLOYER_PRIVATE_KEY=0x...          # wallet que despliega
TOKEN_ADDRESS=0x779877A7B0D9E8603169DdbD7836e478b4624789   # LINK en Sepolia (token de pago)
VITE_WC_PROJECT_ID=...              # de cloud.reown.com
VITE_MARKETPLACE_ADDRESS=           # se completa después del deploy
VITE_TOKEN_ADDRESS=0x779877A7B0D9E8603169DdbD7836e478b4624789   # misma address que TOKEN_ADDRESS
```

## Deploy a Sepolia

El JobMarketplace se paga con un único ERC-20 fijado en el deploy. La address del token
se lee del `.env` (`TOKEN_ADDRESS`).

```
npx hardhat run scripts/deployMarketplace.ts --network sepolia
```

El script imprime la address del marketplace; copiala a `VITE_MARKETPLACE_ADDRESS`.

## Direcciones en Sepolia

- **JobMarketplace:** `TODO: completar después del deploy`
- **Multisig (Entrega 2, usado como evaluador):** `0xfe39aed085e9093ccac10b8c90aa2bb6abf1496e`
- **Token ERC-20 de pago (LINK en Sepolia):** `0x779877A7B0D9E8603169DdbD7836e478b4624789`

El token de pago es **LINK en Sepolia**, el mismo ERC-20 que ya leía el panel de la
Entrega 1. Para probar el flujo se consigue LINK gratis en el faucet de Chainlink
(https://faucets.chain.link/sepolia). LINK tiene 18 decimales.

## Decisiones de diseño

- **Token inmutable.** El ERC-20 de pago se fija en el constructor y no se puede cambiar,
  igual que los signers en el Multisig: más fácil de auditar.
- **Sin OpenZeppelin.** Mantengo el criterio de la Entrega 2 (contrato chico y auditable):
  una interfaz mínima `IERC20` y un lock anti-reentrancy hecho a mano, en vez de traer la
  librería. La contra es que asumo un ERC-20 estándar que devuelve `bool` en
  `transfer`/`transferFrom` (lo cumple el token de pago elegido).
- **Custom errors en vez de strings de revert.** Lo pide la consigna; además gastan menos
  gas y el frontend los puede decodificar por nombre. Es el cambio de estilo respecto a
  la Entrega 2, que usaba `require` con strings.
- **`description` solo en el evento `JobCreated`, no en storage.** El Tablero la lee desde
  los logs. Guardar un `string` on-chain es caro y la consigna misma remarca que el storage
  es caro, así que la descripción no se persiste en el struct.
- **`claimRefund` sin control de acceso ni lock.** La consigna exige que nunca pueda quedar
  bloqueada. En lugar del modifier anti-reentrancy uso CEI: primero pongo `status = Expired`
  y recién después transfiero, así una eventual reentrada cae en `WrongStatus`. Las que sí
  mueven fondos con lock son `fund`, `complete` y `reject`.
- **Anti-reentrancy.** Todas las funciones que mueven fondos siguen Checks-Effects-Interactions
  (cambian el estado antes de transferir). `fund`, `complete` y `reject` además usan un lock
  manual; `claimRefund` solo CEI por la razón de arriba.
- **`getJob` devuelve los campos sueltos** (no el struct), mismo criterio que `getProposal`
  en el Multisig: es más cómodo de leer desde el frontend.

## Desvíos de la especificación

- **MockERC20 con `mint` abierto.** Se usa **solo en los tests** (para que cualquiera
  pueda darse fondos y simular el escrow). No es el token de pago real ni se despliega en
  Sepolia: en Sepolia el pago es en LINK, fijado por `TOKEN_ADDRESS`.
- **`description` fuera del struct.** El "struct completo" del Detalle muestra todas las
  direcciones, estado y expiración; la `description` se obtiene del evento `JobCreated`
  (decisión de diseño explicada arriba).
- **No se usa SafeERC20.** Justificado por el punto "sin OpenZeppelin": el token es único,
  conocido y fijado en el deploy (LINK, un ERC-20 estándar que devuelve `bool`), así que un
  `transfer`/`transferFrom` con chequeo del `bool` de retorno alcanza.
