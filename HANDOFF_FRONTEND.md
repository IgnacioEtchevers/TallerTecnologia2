# Handoff frontend — Job Marketplace

Esto es lo que necesitás para armar la UI sin tocar el contrato. El contrato ya está
escrito, testeado (17/17) y se va a desplegar en Sepolia.

## 1. Archivos que ya están listos para vos

- `src/abis.ts` → exporta `jobMarketplaceAbi` y `erc20Abi`. Copialo tal cual.
- El stack no cambia respecto a la Entrega 2: wagmi v2 + viem + RainbowKit, todo igual.

## 2. Variables de entorno (`.env`)

Sumar a lo que ya teníamos:

```
VITE_MARKETPLACE_ADDRESS=0x...   # JobMarketplace en Sepolia (te lo paso al desplegar)
VITE_TOKEN_ADDRESS=0x779877A7B0D9E8603169DdbD7836e478b4624789   # LINK en Sepolia (token de pago)
```

El token de pago es **LINK en Sepolia** (`0x779877A7B0D9E8603169DdbD7836e478b4624789`),
el mismo que ya leía el panel de la Entrega 1. Tiene **18 decimales**, así que para el
budget usá `parseUnits(valor, 18)` (o directamente `parseEther`, que es lo mismo).

Y en `src/contract.ts` agregá:

```ts
export const MARKETPLACE_ADDRESS = (import.meta.env.VITE_MARKETPLACE_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as Address;
export const TOKEN_ADDRESS = (import.meta.env.VITE_TOKEN_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as Address;
```

## 3. Estados del Job (enum Status)

`getJob` devuelve el `status` como número, en este orden EXACTO:

```
0 Open      1 Funded    2 Submitted
3 Completed 4 Rejected  5 Expired
```

`getJob(id)` devuelve la tupla:
`[client, provider, evaluator, budget, expiresAt, deliverableRef, status]`

`jobCount()` devuelve cuántos jobs hay (los ids van de 0 a jobCount-1).

## 4. Las 3 pantallas

1. **Tablero de Trabajos** — listar todos los jobs. La consigna pide leerlos desde los
   eventos `JobCreated` (ahí viene `description`, que NO está en el storage). Para cada
   job mostrar: descripción, budget, badge de estado, address del cliente. El estado
   actual y el badge salen de `getJob(id)` (porque el evento es solo del momento de
   creación). Para leer los eventos: `publicClient.getContractEvents({ abi, address, eventName: "JobCreated", fromBlock: ... })`.

2. **Detalle de Trabajo** — `getJob(id)` con todas las addresses, estado y expiración.
   Acá va el **panel de acciones según el rol** de la wallet conectada (ver punto 5).

3. **Publicar Trabajo** — form que llama a `createJob(description, budget, evaluator, provider, expiresAt)`.
   Campos: descripción, budget, address del evaluador (se puede pegar la del Multisig),
   proveedor opcional, fecha de expiración. Ojo: `budget` es `uint256` (usá `parseUnits`
   con los decimals del token), `expiresAt` es `uint64` (timestamp en segundos),
   `provider` puede ir en `0x0000...0` si no se asigna.

## 5. Panel de acciones según rol (en Detalle)

| Wallet conectada | Estado del job        | Botón / acción                                  |
|------------------|-----------------------|-------------------------------------------------|
| Cliente          | Open, sin proveedor   | "Asignar Proveedor" → `setProvider(id, prov)`   |
| Cliente          | Open                  | "Fondear" → `approve` del token, después `fund(id)` |
| Cliente          | Open                  | "Rechazar" → `reject(id, reason)`               |
| Proveedor        | Funded                | "Enviar Entrega" → `submit(id, deliverableRef)` |
| Evaluador        | Submitted             | "Aprobar" → `complete(id, reason)` y "Rechazar" → `reject(id, reason)` |
| Cualquiera       | Funded/Submitted + expirado | "Reclamar Reembolso" → `claimRefund(id)`  |

Para saber el rol: comparás `address` conectada (en minúsculas) contra `client` /
`provider` / `evaluator` del `getJob`. Para "expirado": `BigInt(Date.now())/1000n > expiresAt`.

## 6. Detalles importantes de cada escritura

- **Fondear es en 2 pasos**: primero `approve(MARKETPLACE_ADDRESS, budget)` sobre el
  token (ERC-20), y cuando confirma, `fund(id)`. Conviene chequear `allowance` antes
  para no hacer el approve si ya alcanza.
- `deliverableRef` y `reason` son `bytes32`. Si querés mandar texto corto, lo podés
  hashear con `keccak256(toBytes(texto))` o pasar un `0x` + 64 hex. Para esta entrega
  el delivery se guarda off-chain (localStorage alcanza): guardás el contenido y solo
  mandás on-chain un puntero/hash.
- **Estados pending**: usá `useWriteContract` + `useWaitForTransactionReceipt` igual que
  en `ItemPropuesta` de la Entrega 2 (botón deshabilitado mientras `isPending || waiting`).
- **Refresco sin recargar**: al confirmar (`isSuccess`), `refetch()` de la query del job
  (mismo patrón que ya usás).
- **Errores**: el contrato usa *custom errors* (no strings). viem los decodifica; para
  mostrar el motivo claro usá `(error as BaseError).shortMessage` en vez de `error.message`.

## 7. Funciones del contrato (resumen)

```
createJob(string description, uint256 budget, address evaluator, address provider, uint64 expiresAt) -> uint256 id   // cualquiera
setProvider(uint256 id, address provider)        // solo cliente, en Open sin proveedor
fund(uint256 id)                                 // solo cliente, en Open (requiere approve previo)
submit(uint256 id, bytes32 deliverableRef)       // solo proveedor, en Funded
complete(uint256 id, bytes32 reason)             // solo evaluador, en Submitted (paga al proveedor)
reject(uint256 id, bytes32 reason)               // cliente en Open / evaluador en Funded|Submitted
claimRefund(uint256 id)                           // cualquiera, si expiró (Funded|Submitted)
```

Eventos para escuchar: `JobCreated`, `ProviderSet`, `Funded`, `Submitted`, `Completed`,
`Rejected`, `Expired`.

Cualquier duda del contrato, pregúntenme.
