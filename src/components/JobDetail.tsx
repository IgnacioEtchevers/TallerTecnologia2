import { useReadContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatEther } from "viem";
import { jobMarketplaceAbi } from "../abis";
import { MARKETPLACE_ADDRESS } from "../contract";

const STATE = ["Open", "Funded", "Submitted", "Completed", "Rejected", "Expired"] as const;

type JobDetailProps = {
  jobId: bigint;
  onBack: () => void;
};

export const JobDetail = ({ jobId, onBack }: JobDetailProps) => {
  const { data: job } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: jobMarketplaceAbi,
    functionName: "getJob",
    args: [jobId],
    chainId: sepolia.id,
  });

  if (!job) {
    return (
      <section className="card">
        <button onClick={onBack}>← Volver</button>
        <p>Cargando trabajo #{jobId.toString()}…</p>
      </section>
    );
  }

  const [client, provider, evaluator, budget, expiresAt, deliverableRef, status] = job;
  const state = STATE[Number(status)] ?? "?";
  const expira = new Date(Number(expiresAt) * 1000).toLocaleString();

  return (
    <section className="card">
      <button onClick={onBack}>← Volver</button>

      <div className="propTop">
        <h2>Trabajo #{jobId.toString()}</h2>
        <span className="badge">{state}</span>
      </div>

      <div className="fila"><span>Cliente</span><code>{client}</code></div>
      <div className="fila"><span>Proveedor</span><code>{provider}</code></div>
      <div className="fila"><span>Evaluador</span><code>{evaluator}</code></div>
      <div className="fila"><span>Budget</span><b>{formatEther(budget)} LINK</b></div>
      <div className="fila"><span>Expira</span><b>{expira}</b></div>
      <div className="fila"><span>Deliverable</span><code>{deliverableRef}</code></div>

    </section>
  );
};
