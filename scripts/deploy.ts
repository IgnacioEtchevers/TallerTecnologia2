import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const raw = process.env.SIGNERS || "";
  const thresholdRaw = process.env.THRESHOLD || "";

  if (!raw || !thresholdRaw) {
    throw new Error("Falta SIGNERS o THRESHOLD en el .env");
  }

  const signers = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0) as `0x${string}`[];
  const threshold = BigInt(thresholdRaw);

  console.log("Desplegando Multisig en", hre.network.name, "...");
  console.log("  signers   =", signers);
  console.log("  threshold =", threshold.toString());

  const ms = await hre.viem.deployContract("Multisig", [signers, threshold]);

  console.log("");
  console.log("Multisig desplegado en:", ms.address);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
