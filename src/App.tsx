import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { InfoContrato } from "./components/InfoContrato";
import { NuevaPropuesta } from "./components/NuevaPropuesta";
import { ListaPropuestas } from "./components/ListaPropuestas";
import { multisigAbi } from "./abis";
import { MULTISIG_ADDRESS } from "./contract";

export default function App() {
  const { address, isConnected } = useAccount();

  // chequeo si la wallet conectada es uno de los signers
  const { data: esSigner } = useReadContract({
    address: MULTISIG_ADDRESS,
    abi: multisigAbi,
    functionName: "isSigner",
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: { enabled: Boolean(address) },
  });

  if (!isConnected) {
    return (
      <div className="hero">
        <h1>Multisig - Entrega 2</h1>
        <p>Conectá tu wallet en Sepolia para ver y operar el contrato.</p>
        <ConnectButton label="Conectar wallet" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="top">
        <h1>Multisig</h1>
        <ConnectButton />
      </div>

      <InfoContrato />

      {esSigner ? (
        <>
          <NuevaPropuesta />
          <ListaPropuestas />
        </>
      ) : (
        <section className="card aviso">
          <h2>No sos signer</h2>
          <p>
            Estás conectado con <code>{address}</code>, pero esa dirección no
            está autorizada a operar este multisig. Cambiá a una de las wallets
            listadas arriba para poder proponer, aprobar o ejecutar.
          </p>
        </section>
      )}
    </div>
  );
}
