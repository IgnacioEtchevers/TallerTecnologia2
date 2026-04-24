import { useAccount, useBalance, useBlockNumber, useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";
import { formatUnits } from "viem";

export function Cuenta() {
  const { address } = useAccount();

  // el ENS solo existe en mainnet, así que forzamos ese chainId
  const { data: ens } = useEnsName({ address, chainId: mainnet.id });

  // saldo nativo de ETH
  const { data: bal } = useBalance({ address });

  // block number en vivo (watch: true refresca cada bloque nuevo)
  const { data: bloque } = useBlockNumber({ watch: true });

  if (!address) return null;

  const nombre =
    ens ?? `${address.slice(0, 6)}…${address.slice(-4)}`;

  // 4 decimales como pide la consigna
  const eth = bal
    ? Number(formatUnits(bal.value, bal.decimals)).toFixed(4)
    : "—";

  return (
    <section className="card">
      <h2>Panel de Cuenta</h2>
      <div className="fila">
        <span>Wallet</span>
        <b title={address}>{nombre}</b>
      </div>
      <div className="fila">
        <span>Saldo ETH</span>
        <b>{eth} ETH</b>
      </div>
      <div className="fila">
        <span>Bloque actual</span>
        <b>{bloque ? bloque.toString() : "…"}</b>
      </div>
    </section>
  );
}
