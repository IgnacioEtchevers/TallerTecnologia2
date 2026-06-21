import { useEffect, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { sepolia } from "wagmi/chains";
import { keccak256, toBytes, isAddress, type Address, type BaseError } from "viem";
import { jobMarketplaceAbi } from "../abis";
import { MARKETPLACE_ADDRESS } from "../contract";

const OPEN = 0;
const FUNDED = 1;
const SUBMITTED = 2;
const ZERO = "0x0000000000000000000000000000000000000000";

type ActionPanelProps = {
  jobId: bigint;
  client: string;
  provider: string;
  evaluator: string;
  status: number;
  expiresAt: bigint;
  onChange: () => void;
};

export const ActionPanel = ({
  jobId,
  client,
  provider,
  evaluator,
  status,
  expiresAt,
  onChange,
}: ActionPanelProps) => {
  const { address } = useAccount();
  const me = address?.toLowerCase();

  const isClient = me === client.toLowerCase();
  const isProvider = me === provider.toLowerCase();
  const isEvaluator = me === evaluator.toLowerCase();

  const withoutProvider = provider.toLowerCase() === ZERO;
  const expired = BigInt(Math.floor(Date.now() / 1000)) > expiresAt;

  const [provInput, setProvInput] = useState("");
  const [delivery, setDelivery] = useState("");
  const [reason, setReason] = useState("");

  const base = { 
    address: MARKETPLACE_ADDRESS, 
    abi: jobMarketplaceAbi, 
    chainId: sepolia.id 
  } as const;
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: waiting, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) onChange();
  }, [isSuccess, onChange]);

  const isTransactionProcessing = isPending || waiting;
  const reasonRef = () => keccak256(toBytes(reason || "-"));

  const assignProvider = () => {
    if (!isAddress(provInput)) return;
    writeContract({ ...base, functionName: "setProvider", args: [jobId, provInput as Address] });
  }
  
  const sendDelivery = () => {
    const ref = keccak256(toBytes(delivery || "-"));
    localStorage.setItem(`delivery:${jobId}`, delivery);
    writeContract({ ...base, functionName: "submit", args: [jobId, ref] });
  }
  
  const approve = () => {
    writeContract({ ...base, functionName: "complete", args: [jobId, reasonRef()] });
  }

  const reject = () => {
    writeContract({ ...base, functionName: "reject", args: [jobId, reasonRef()] });
  }
  const claim = () => {
    writeContract({ ...base, functionName: "claimRefund", args: [jobId] });
  }

  return (
    <div className="signers">
      {isClient && status === OPEN && withoutProvider && (
        <div className="acciones">
          <input
            placeholder="0x... proveedor"
            value={provInput}
            onChange={(e) => setProvInput(e.target.value)}
          />
          <button disabled={isTransactionProcessing} onClick={assignProvider}>Asignar proveedor</button>
        </div>
      )}

      {/* Cliente, Open → rechazar (el Fondear viene en la Parte B2) */}
      {isClient && status === OPEN && (
        <div className="acciones">
          <input
            placeholder="motivo (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button className="ghost" disabled={isTransactionProcessing} onClick={reject}>Rechazar</button>
        </div>
      )}

      {/* Proveedor, Funded → enviar entrega */}
      {isProvider && status === FUNDED && (
        <div className="acciones">
          <input
            placeholder="contenido de la entrega"
            value={delivery}
            onChange={(e) => setDelivery(e.target.value)}
          />
          <button disabled={isTransactionProcessing} onClick={sendDelivery}>Enviar entrega</button>
        </div>
      )}

      {/* Evaluador, Submitted → aprobar / rechazar */}
      {isEvaluator && status === SUBMITTED && (
        <div className="acciones">
          <input
            placeholder="motivo (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button disabled={isTransactionProcessing} onClick={approve}>Aprobar</button>
          <button className="ghost" disabled={isTransactionProcessing} onClick={reject}>Rechazar</button>
        </div>
      )}

      {expired && (status === FUNDED || status === SUBMITTED) && (
        <div className="acciones">
          <button disabled={isTransactionProcessing} onClick={claim}>Reclamar reembolso</button>
        </div>
      )}

      {isTransactionProcessing && <p>Procesando transacción…</p>}
      {error && <p className="err">{(error as BaseError).shortMessage}</p>}
    </div>
  );
};
