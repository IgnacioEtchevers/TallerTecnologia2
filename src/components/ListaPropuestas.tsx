import { useReadContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { multisigAbi } from "../abis";
import { MULTISIG_ADDRESS } from "../contract";
import { ItemPropuesta } from "./ItemPropuesta";

export function ListaPropuestas() {
  const { data: total } = useReadContract({
    address: MULTISIG_ADDRESS,
    abi: multisigAbi,
    functionName: "proposalCount",
    chainId: sepolia.id,
  });

  const n = total ? Number(total) : 0;

  if (n === 0) {
    return (
      <section className="card">
        <h2>Propuestas</h2>
        <p>No hay propuestas todavía.</p>
      </section>
    );
  }

  // mostramos las más nuevas primero
  const ids: bigint[] = [];
  for (let i = n - 1; i >= 0; i--) ids.push(BigInt(i));

  return (
    <section className="card">
      <h2>Propuestas</h2>
      {ids.map((id) => (
        <ItemPropuesta key={id.toString()} id={id} />
      ))}
    </section>
  );
}
