# Entrega 2 - Multisig

Contrato Multisig "programático" en Solidity + UI en React para operarlo. Despliegue en Sepolia.

## Stack

- Solidity 0.8.20 + Hardhat 2.22 (`@nomicfoundation/hardhat-toolbox-viem`).
- React 18 + Vite + TypeScript.
- wagmi v2 + viem + RainbowKit v2 para conectar la wallet y leer/escribir el contrato.

## Decisión de diseño

Los signers son **fijos en el deploy**: se pasan en el constructor y no se pueden cambiar después. La consigna permitía hacerlos dinámicos (con funciones protegidas por el propio multisig), pero para el alcance de esta entrega me pareció innecesario y más fácil de auditar fijo.

El umbral (`threshold`) también queda fijo en el constructor y debe cumplir `1 <= threshold <= signers.length`.

## Cómo correrlo

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar `.env`

```bash
cp .env.example .env
```

Después editar `.env`:

```
SEPOLIA_RPC_URL=https://...  # tu RPC, ej de Alchemy o Infura
DEPLOYER_PRIVATE_KEY=0x...   # private key de la wallet que va a desplegar
SIGNERS=0xWALLET_1,0xWALLET_2,0xWALLET_3
THRESHOLD=2
VITE_WC_PROJECT_ID=...       # de cloud.reown.com
VITE_MULTISIG_ADDRESS=       # se completa después del deploy
```

### 3. Compilar y testear el contrato

```bash
npx hardhat compile
npx hardhat test
```

### 4. Desplegar a Sepolia

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

El script imprime la dirección del contrato. Copiala a `VITE_MULTISIG_ADDRESS` en `.env`.

### 5. Correr el frontend

```bash
npm run dev
```

Abrir `http://localhost:5173`, conectar MetaMask en Sepolia con alguna de las wallets signer y operar.

## Despliegue actual en Sepolia

> Completar después de hacer el deploy:

- **Contrato:** `0x...PEGAR_AQUI_LA_ADDRESS`
- **Signers:**
  - `0xTU_WALLET_PRINCIPAL` (signer 1, deployer)
  - `0x6B5388A73fCfA5B04044ed27Eda725f0e6325259` (signer 2)
  - `0x49DD72aD4ACA2dD69D5A1aaFd5742da512227729` (signer 3)
- **Threshold:** 2 de 3

> Las wallets 2 y 3 se generaron para esta entrega. Sus private keys quedan documentadas aparte (no en el repo).

## Flujo end-to-end para probar

1. Mandar algo de SepoliaETH al contrato (cualquier wallet puede hacerlo).
2. Con el **signer 1**, crear una propuesta (ej: mandar 0.001 ETH a otra address).
3. Cambiar la wallet conectada al **signer 2** y aprobar.
4. Cambiar al **signer 3** y aprobar (o el 2 ya alcanza con threshold 2).
5. Con cualquier signer, apretar **Ejecutar**. La propuesta queda como `Ejecutada` y el destinatario recibe el ETH.

## Estructura del proyecto

```
contracts/
  Multisig.sol
scripts/
  deploy.ts
test/
  Multisig.test.ts
src/
  abis.ts
  config.ts
  contract.ts
  main.tsx
  App.tsx
  styles.css
  components/
    InfoContrato.tsx
    NuevaPropuesta.tsx
    ListaPropuestas.tsx
    ItemPropuesta.tsx
hardhat.config.ts
vite.config.ts
```
