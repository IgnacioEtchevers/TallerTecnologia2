import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// Despliega el JobMarketplace apuntando a un ERC-20 ya existente en la red.
// El token de pago es LINK en Sepolia (ver TOKEN_ADDRESS en el .env), el mismo
// que ya usaba el panel de la Entrega 1.
async function main() {
  const token = (process.env.TOKEN_ADDRESS || "").trim();

  if (!token) {
    throw new Error("Falta TOKEN_ADDRESS en el .env (la address del ERC-20 de pago, ej LINK)");
  }

  console.log("Desplegando JobMarketplace en", hre.network.name, "...");
  console.log("  token =", token);

  const market = await hre.viem.deployContract("JobMarketplace", [
    token as `0x${string}`,
  ]);

  console.log("");
  console.log("JobMarketplace desplegado en:", market.address);
  console.log("Copiala a VITE_MARKETPLACE_ADDRESS (y el token a VITE_TOKEN_ADDRESS).");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
