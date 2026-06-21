import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { sepolia } from "wagmi/chains";
import { type BaseError } from "viem";
import { jobMarketplaceAbi, erc20Abi } from "../abis";
import { MARKETPLACE_ADDRESS, TOKEN_ADDRESS } from "../contract";

type FundButtonProps = {
  jobId: bigint;
  budget: bigint;
  onChange: () => void;
};

type FundStep = "approve" | "fund" | null

export const FundButton = ({ jobId, budget, onChange }: FundButtonProps) => {
  const { address } = useAccount();

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, MARKETPLACE_ADDRESS] : undefined,
    chainId: sepolia.id,
    query: { enabled: Boolean(address) },
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: waiting, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [step, setStep] = useState<FundStep>(null);

  useEffect(() => {
    if (!isSuccess) return;
    if (step === "approve") refetchAllowance();
    if (step === "fund") onChange();
    setStep(null);
  }, [isSuccess]);

  const enough = allowance !== undefined && allowance >= budget;
  const isProcessing = isPending || waiting;

  const doApprove = () => {
    setStep("approve");
    writeContract({
      address: TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [MARKETPLACE_ADDRESS, budget],
      chainId: sepolia.id,
    });
  };

  const doFund = () => {
    setStep("fund");
    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: jobMarketplaceAbi,
      functionName: "fund",
      args: [jobId],
      chainId: sepolia.id,
    });
  };

  return (
    <div className="acciones">
      {!enough ? (
        <button disabled={isProcessing} onClick={doApprove}>
          {isProcessing ? "Aprobando…" : "1. Aprobar LINK"}
        </button>
      ) : (
        <button disabled={isProcessing} onClick={doFund}>
          {isProcessing ? "Fondeando…" : "2. Fondear"}
        </button>
      )}
      {error && <p className="err">{(error as BaseError).shortMessage}</p>}
    </div>
  );
};
