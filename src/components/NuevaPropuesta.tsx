import { useState, type FormEvent } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { isAddress, parseEther, type Address } from "viem";
import { multisigAbi } from "../abis";
import { MULTISIG_ADDRESS } from "../contract";

export function NuevaPropuesta() {
  const [destino, setDestino] = useState("");
  const [valor, setValor] = useState("");
  const [calldata, setCalldata] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: waiting, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!isAddress(destino)) {
      setErrorMsg("La dirección de destino no es válida.");
      return;
    }

    let v: bigint;
    try {
      v = valor.trim() === "" ? 0n : parseEther(valor.trim());
    } catch {
      setErrorMsg("El valor en ETH no es válido.");
      return;
    }

    const data = (calldata.trim() === "" ? "0x" : calldata.trim()) as `0x${string}`;
    if (!/^0x([0-9a-fA-F]{2})*$/.test(data)) {
      setErrorMsg("La calldata tiene que ser hex (ej: 0x o 0xab12).");
      return;
    }

    writeContract({
      address: MULTISIG_ADDRESS,
      abi: multisigAbi,
      functionName: "propose",
      args: [destino as Address, v, data],
    });
  }

  return (
    <section className="card">
      <h2>Nueva propuesta</h2>
      <form onSubmit={enviar} className="formProp">
        <label>
          Dirección destino
          <input
            placeholder="0x..."
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            required
          />
        </label>
        <label>
          Valor en ETH
          <input
            placeholder="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </label>
        <label>
          Calldata (hex, opcional)
          <input
            placeholder="0x"
            value={calldata}
            onChange={(e) => setCalldata(e.target.value)}
          />
        </label>
        <button type="submit" disabled={isPending || waiting}>
          {isPending
            ? "Confirmá en la wallet..."
            : waiting
            ? "Esperando confirmación..."
            : "Crear propuesta"}
        </button>
        {errorMsg && <p className="err">{errorMsg}</p>}
        {error && <p className="err">{(error as Error).message}</p>}
        {isSuccess && <p className="ok">Propuesta creada.</p>}
      </form>
    </section>
  );
}
