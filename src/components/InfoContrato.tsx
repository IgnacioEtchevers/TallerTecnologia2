import { useBalance, useReadContracts } from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatEther } from "viem";
import { multisigAbi } from "../abis";
import { MULTISIG_ADDRESS } from "../contract";

export function InfoContrato() {
  const base = {
    address: MULTISIG_ADDRESS,
    abi: multisigAbi,
    chainId: sepolia.id,
  } as const;

  const { data, isLoading } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...base, functionName: "threshold" },
      { ...base, functionName: "getSigners" },
      { ...base, functionName: "proposalCount" },
    ],
  });

  const { data: bal } = useBalance({
    address: MULTISIG_ADDRESS,
    chainId: sepolia.id,
  });

  if (isLoading || !data) {
    return (
      <section className="card">
        <h2>Información del contrato</h2>
        <p>Cargando...</p>
      </section>
    );
  }

  const [threshold, signers, count] = data;
  const eth = bal ? Number(formatEther(bal.value)).toFixed(4) : "-";

  return (
    <section className="card">
      <h2>Información del contrato</h2>
      <div className="fila">
        <span>Dirección</span>
        <b>
          <code>{MULTISIG_ADDRESS}</code>
        </b>
      </div>
      <div className="fila">
        <span>Threshold</span>
        <b>
          {threshold.toString()} de {signers.length}
        </b>
      </div>
      <div className="fila">
        <span>Saldo del contrato</span>
        <b>{eth} ETH</b>
      </div>
      <div className="fila">
        <span>Propuestas totales</span>
        <b>{count.toString()}</b>
      </div>
      <div className="signers">
        <span>Signers</span>
        <ul>
          {signers.map((s) => (
            <li key={s}>
              <code>{s}</code>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
