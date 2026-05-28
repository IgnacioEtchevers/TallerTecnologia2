import { useEffect } from "react";
import {
  useAccount,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatEther } from "viem";
import { multisigAbi } from "../abis";
import { MULTISIG_ADDRESS } from "../contract";

type Props = { id: bigint };

export function ItemPropuesta({ id }: Props) {
  const { address } = useAccount();
  const base = {
    address: MULTISIG_ADDRESS,
    abi: multisigAbi,
    chainId: sepolia.id,
  } as const;

  const { data, refetch } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...base, functionName: "getProposal", args: [id] },
      { ...base, functionName: "threshold" },
      { ...base, functionName: "approvedBy", args: [id, address!] },
    ],
    query: { enabled: Boolean(address) },
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: waiting, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // si una tx termina, refresco los datos de la propuesta
  useEffect(() => {
    if (isSuccess) {
      refetch();
    }
  }, [isSuccess, refetch]);

  if (!data) return null;

  const [prop, threshold, yaAprobo] = data;
  const [proposer, to, value, calldata, approvals, executed, cancelled] = prop;

  let estado: "Pendiente" | "Ejecutada" | "Cancelada" = "Pendiente";
  if (executed) estado = "Ejecutada";
  else if (cancelled) estado = "Cancelada";

  const enCurso = !executed && !cancelled;
  const puedoAprobar = enCurso && !yaAprobo;
  const puedoEjecutar = enCurso && approvals >= threshold;
  const puedoCancelar =
    enCurso &&
    address !== undefined &&
    address.toLowerCase() === proposer.toLowerCase();

  function aprobar() {
    writeContract({ ...base, functionName: "approve", args: [id] });
  }
  function ejecutar() {
    writeContract({ ...base, functionName: "execute", args: [id] });
  }
  function cancelar() {
    writeContract({ ...base, functionName: "cancel", args: [id] });
  }

  const txEnVuelo = isPending || waiting;

  return (
    <div className="prop">
      <div className="propTop">
        <b>Propuesta #{id.toString()}</b>
        <span className={`badge ${estado.toLowerCase()}`}>{estado}</span>
      </div>
      <div className="fila">
        <span>Destino</span>
        <b>
          <code>{to}</code>
        </b>
      </div>
      <div className="fila">
        <span>Valor</span>
        <b>{formatEther(value)} ETH</b>
      </div>
      <div className="fila">
        <span>Calldata</span>
        <b>
          <code>{calldata === "0x" ? "(vacía)" : calldata}</code>
        </b>
      </div>
      <div className="fila">
        <span>Proposer</span>
        <b>
          <code>{proposer}</code>
        </b>
      </div>
      <div className="fila">
        <span>Aprobaciones</span>
        <b>
          {approvals.toString()} / {threshold.toString()}
        </b>
      </div>
      <div className="acciones">
        <button onClick={aprobar} disabled={!puedoAprobar || txEnVuelo}>
          {yaAprobo ? "Ya aprobaste" : "Aprobar"}
        </button>
        <button onClick={ejecutar} disabled={!puedoEjecutar || txEnVuelo}>
          Ejecutar
        </button>
        <button
          onClick={cancelar}
          disabled={!puedoCancelar || txEnVuelo}
          className="ghost"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
