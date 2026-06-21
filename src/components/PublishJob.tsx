import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { sepolia } from "wagmi/chains";
import { parseEther, type Address, type BaseError } from "viem";
import { jobMarketplaceAbi } from "../abis";
import { MARKETPLACE_ADDRESS } from "../contract";
import { publishJobSchema, type PublishJobValues } from "../schemas";

const ZERO = "0x0000000000000000000000000000000000000000";

type PublishJobProps = {
  onPublished: () => void;
};

export const PublishJob = ({ onPublished }: PublishJobProps) => {
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PublishJobValues>({
    resolver: zodResolver(publishJobSchema),
    defaultValues: { 
      description: "", 
      budget: "", 
      evaluator: "", 
      provider: "", 
      expiresAt: "" 
    },
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: waiting, isSuccess } = useWaitForTransactionReceipt({ hash });
  const isProcessing = isPending || waiting;

  useEffect(() => {
    if (isSuccess) onPublished();
  }, [isSuccess, onPublished]);

  const onSubmit = (values: PublishJobValues) => {
    const prov = values.provider.trim() === "" ? ZERO : values.provider.trim();
    const budgetWei = parseEther(values.budget.trim());
    const expiresSec = BigInt(Math.floor(new Date(values.expiresAt).getTime() / 1000));

    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: jobMarketplaceAbi,
      functionName: "createJob",
      chainId: sepolia.id,
      args: [
        values.description.trim(), 
        budgetWei, 
        values.evaluator as Address, 
        prov as Address, 
        expiresSec
      ],
    });
  };

  return (
    <section className="card">
      <h2>Publicar trabajo</h2>
      
      <form className="formProp" onSubmit={handleSubmit(onSubmit)}>
        <label>
          Descripción
          <input {...register("description")} />
        </label>
        {errors.description && <p className="err">{errors.description.message}</p>}

        <label>
          Budget (LINK)
          <input placeholder="5" {...register("budget")} />
        </label>
        {errors.budget && <p className="err">{errors.budget.message}</p>}

        <label>
          Evaluador (address)
          <input placeholder="0x... (podés pegar el Multisig)" {...register("evaluator")} />
        </label>
        {errors.evaluator && <p className="err">{errors.evaluator.message}</p>}

        <label>
          Proveedor (opcional)
          <input placeholder="0x... (vacío = sin asignar)" {...register("provider")} />
        </label>
        {errors.provider && <p className="err">{errors.provider.message}</p>}

        <label>
          Expira
          <input type="datetime-local" {...register("expiresAt")} />
        </label>
        {errors.expiresAt && <p className="err">{errors.expiresAt.message}</p>}

        <button type="submit" disabled={isProcessing}>
          {isPending ? "Confirmá en la wallet…" : waiting ? "Esperando confirmación…" : "Publicar"}
        </button>

        {error && <p className="err">{(error as BaseError).shortMessage}</p>}
      </form>
    </section>
  );
};
