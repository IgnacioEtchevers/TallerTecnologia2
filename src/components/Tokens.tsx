import { useAccount, useReadContracts } from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatUnits, type Address } from "viem";
import { erc20 } from "../abis";

// LINK y USDC en Sepolia
const TOKENS: Address[] = [
  "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
];

export function Tokens() {
  const { address } = useAccount();
  if (!address) return null;

  return (
    <section className="card">
      <h2>Tokens (Sepolia)</h2>
      {TOKENS.map((t) => (
        <Token key={t} contrato={t} owner={address} />
      ))}
    </section>
  );
}

function Token({ contrato, owner }: { contrato: Address; owner: Address }) {
  const base = { address: contrato, abi: erc20, chainId: sepolia.id } as const;

  const { data, isLoading, isError } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...base, functionName: "name" },
      { ...base, functionName: "symbol" },
      { ...base, functionName: "decimals" },
      { ...base, functionName: "balanceOf", args: [owner] },
    ],
  });

  if (isLoading) return <div className="fila"><span>Cargando...</span></div>;
  if (isError || !data) return <div className="fila"><span>Error</span></div>;

  const [name, symbol, decimals, raw] = data;
  const monto = Number(formatUnits(raw, decimals)).toFixed(4);

  return (
    <div className="fila">
      <span>{name} ({symbol})</span>
      <b>{monto} {symbol}</b>
    </div>
  );
}
