import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther, zeroAddress, encodeFunctionData } from "viem";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("JobMarketplace", function () {
  const BUDGET = parseEther("100");
  // referencias bytes32 cualquiera para deliverable y reason
  const DELIVERABLE = ("0x" + "ab".repeat(32)) as `0x${string}`;
  const REASON = ("0x" + "cd".repeat(32)) as `0x${string}`;

  // estados (tienen que coincidir con el enum Status del contrato)
  const Open = 0;
  const Funded = 1;
  const Submitted = 2;
  const Completed = 3;
  const Rejected = 4;
  const Expired = 5;

  async function deploy() {
    const wallets = await hre.viem.getWalletClients();
    const [cliente, proveedor, evaluador, otro, s1, s2, s3] = wallets;

    const token = await hre.viem.deployContract("MockERC20", []);
    const market = await hre.viem.deployContract("JobMarketplace", [token.address]);

    // le doy tokens al cliente para que pueda fondear
    await token.write.mint([cliente.account.address, BUDGET * 10n]);

    const pub = await hre.viem.getPublicClient();
    return { token, market, pub, cliente, proveedor, evaluador, otro, s1, s2, s3 };
  }

  // helpers para escribir desde otra wallet (mismo patron que en el Multisig)
  async function marketAs(addr: `0x${string}`, wallet: any) {
    return hre.viem.getContractAt("JobMarketplace", addr, { client: { wallet } });
  }
  async function tokenAs(addr: `0x${string}`, wallet: any) {
    return hre.viem.getContractAt("MockERC20", addr, { client: { wallet } });
  }
  async function multisigAs(addr: `0x${string}`, wallet: any) {
    return hre.viem.getContractAt("Multisig", addr, { client: { wallet } });
  }

  async function enUnaHora() {
    return BigInt(await time.latest()) + 3600n;
  }

  // crea un job (cliente = wallet por defecto) y devuelve su id
  async function crearJob(
    market: any,
    evaluador: `0x${string}`,
    provider: `0x${string}`
  ) {
    const exp = await enUnaHora();
    await market.write.createJob(["un trabajo", BUDGET, evaluador, provider, exp]);
    const total = await market.read.jobCount();
    return total - 1n;
  }

  describe("createJob", function () {
    it("crea un job en Open con los datos correctos", async function () {
      const { market, cliente, proveedor, evaluador } = await deploy();
      const id = await crearJob(
        market,
        evaluador.account.address,
        proveedor.account.address
      );
      const [client, provider, evalu, budget, , , status] = await market.read.getJob([id]);
      expect(getAddress(client)).to.equal(getAddress(cliente.account.address));
      expect(getAddress(provider)).to.equal(getAddress(proveedor.account.address));
      expect(getAddress(evalu)).to.equal(getAddress(evaluador.account.address));
      expect(budget).to.equal(BUDGET);
      expect(status).to.equal(Open);
    });

    it("revierte si el evaluador es address(0)", async function () {
      const { market, proveedor } = await deploy();
      const exp = await enUnaHora();
      await expect(
        market.write.createJob(["x", BUDGET, zeroAddress, proveedor.account.address, exp])
      ).to.be.rejectedWith("EvaluatorRequired");
    });

    it("revierte si el budget es 0", async function () {
      const { market, evaluador } = await deploy();
      const exp = await enUnaHora();
      await expect(
        market.write.createJob(["x", 0n, evaluador.account.address, zeroAddress, exp])
      ).to.be.rejectedWith("ZeroBudget");
    });

    it("revierte si expiresAt ya paso", async function () {
      const { market, evaluador } = await deploy();
      const pasado = BigInt(await time.latest()) - 1n;
      await expect(
        market.write.createJob(["x", BUDGET, evaluador.account.address, zeroAddress, pasado])
      ).to.be.rejectedWith("InvalidExpiry");
    });
  });

  describe("Happy path", function () {
    it("crear -> fondear -> entregar -> completar paga al proveedor", async function () {
      const { token, market, cliente, proveedor, evaluador } = await deploy();
      const id = await crearJob(
        market,
        evaluador.account.address,
        proveedor.account.address
      );

      // fondear: approve + fund (los dos los hace el cliente)
      await token.write.approve([market.address, BUDGET]);
      await market.write.fund([id]);
      let [, , , , , , status] = await market.read.getJob([id]);
      expect(status).to.equal(Funded);
      expect(await token.read.balanceOf([market.address])).to.equal(BUDGET);

      // entregar (proveedor)
      const mProv = await marketAs(market.address, proveedor);
      await mProv.write.submit([id, DELIVERABLE]);
      [, , , , , , status] = await market.read.getJob([id]);
      expect(status).to.equal(Submitted);

      // completar (evaluador) -> el proveedor cobra
      const mEval = await marketAs(market.address, evaluador);
      const antes = await token.read.balanceOf([proveedor.account.address]);
      await mEval.write.complete([id, REASON]);
      const despues = await token.read.balanceOf([proveedor.account.address]);

      expect(despues - antes).to.equal(BUDGET);
      [, , , , , , status] = await market.read.getJob([id]);
      expect(status).to.equal(Completed);
      // el escrow quedo vacio
      expect(await token.read.balanceOf([market.address])).to.equal(0n);
    });
  });

  describe("Rechazo", function () {
    it("el cliente rechaza en Open (no hay fondos que devolver)", async function () {
      const { market, proveedor, evaluador } = await deploy();
      const id = await crearJob(
        market,
        evaluador.account.address,
        proveedor.account.address
      );
      await market.write.reject([id, REASON]);
      const [, , , , , , status] = await market.read.getJob([id]);
      expect(status).to.equal(Rejected);
    });

    it("el evaluador rechaza en Funded y le devuelve el escrow al cliente", async function () {
      const { token, market, cliente, proveedor, evaluador } = await deploy();
      const id = await crearJob(
        market,
        evaluador.account.address,
        proveedor.account.address
      );
      const saldoInicial = await token.read.balanceOf([cliente.account.address]);

      await token.write.approve([market.address, BUDGET]);
      await market.write.fund([id]);

      const mEval = await marketAs(market.address, evaluador);
      await mEval.write.reject([id, REASON]);

      const [, , , , , , status] = await market.read.getJob([id]);
      expect(status).to.equal(Rejected);
      // el cliente recupera todo
      expect(await token.read.balanceOf([cliente.account.address])).to.equal(saldoInicial);
    });

    it("el evaluador rechaza en Submitted y le devuelve el escrow al cliente", async function () {
      const { token, market, cliente, proveedor, evaluador } = await deploy();
      const id = await crearJob(
        market,
        evaluador.account.address,
        proveedor.account.address
      );
      const saldoInicial = await token.read.balanceOf([cliente.account.address]);

      await token.write.approve([market.address, BUDGET]);
      await market.write.fund([id]);
      const mProv = await marketAs(market.address, proveedor);
      await mProv.write.submit([id, DELIVERABLE]);

      const mEval = await marketAs(market.address, evaluador);
      await mEval.write.reject([id, REASON]);

      const [, , , , , , status] = await market.read.getJob([id]);
      expect(status).to.equal(Rejected);
      expect(await token.read.balanceOf([cliente.account.address])).to.equal(saldoInicial);
    });
  });

  describe("Expiracion", function () {
    it("claimRefund funciona desde Funded", async function () {
      const { token, market, cliente, proveedor, evaluador, otro } = await deploy();
      const id = await crearJob(
        market,
        evaluador.account.address,
        proveedor.account.address
      );
      const saldoInicial = await token.read.balanceOf([cliente.account.address]);

      await token.write.approve([market.address, BUDGET]);
      await market.write.fund([id]);

      // dejo pasar el tiempo de expiracion
      await time.increase(3601);

      // cualquiera puede reclamar el reembolso (lo llama "otro")
      const mOtro = await marketAs(market.address, otro);
      await mOtro.write.claimRefund([id]);

      const [, , , , , , status] = await market.read.getJob([id]);
      expect(status).to.equal(Expired);
      expect(await token.read.balanceOf([cliente.account.address])).to.equal(saldoInicial);
    });

    it("claimRefund funciona desde Submitted", async function () {
      const { token, market, cliente, proveedor, evaluador, otro } = await deploy();
      const id = await crearJob(
        market,
        evaluador.account.address,
        proveedor.account.address
      );
      const saldoInicial = await token.read.balanceOf([cliente.account.address]);

      await token.write.approve([market.address, BUDGET]);
      await market.write.fund([id]);
      const mProv = await marketAs(market.address, proveedor);
      await mProv.write.submit([id, DELIVERABLE]);

      await time.increase(3601);

      const mOtro = await marketAs(market.address, otro);
      await mOtro.write.claimRefund([id]);

      const [, , , , , , status] = await market.read.getJob([id]);
      expect(status).to.equal(Expired);
      expect(await token.read.balanceOf([cliente.account.address])).to.equal(saldoInicial);
    });

    it("claimRefund revierte si todavia no expiro", async function () {
      const { token, market, proveedor, evaluador, otro } = await deploy();
      const id = await crearJob(
        market,
        evaluador.account.address,
        proveedor.account.address
      );
      await token.write.approve([market.address, BUDGET]);
      await market.write.fund([id]);

      const mOtro = await marketAs(market.address, otro);
      await expect(mOtro.write.claimRefund([id])).to.be.rejectedWith("NotExpired");
    });
  });

  describe("Control de acceso", function () {
    it("setProvider solo lo puede llamar el cliente", async function () {
      const { market, evaluador, otro } = await deploy();
      // job sin proveedor (provider = address(0))
      const id = await crearJob(market, evaluador.account.address, zeroAddress);
      const mOtro = await marketAs(market.address, otro);
      await expect(
        mOtro.write.setProvider([id, otro.account.address])
      ).to.be.rejectedWith("NotClient");
    });

    it("fund solo lo puede llamar el cliente", async function () {
      const { token, market, proveedor, evaluador, otro } = await deploy();
      const id = await crearJob(
        market,
        evaluador.account.address,
        proveedor.account.address
      );
      // le doy allowance a otro para descartar que falle por allowance
      const tOtro = await tokenAs(token.address, otro);
      await tOtro.write.approve([market.address, BUDGET]);
      const mOtro = await marketAs(market.address, otro);
      await expect(mOtro.write.fund([id])).to.be.rejectedWith("NotClient");
    });

    it("submit solo lo puede llamar el proveedor", async function () {
      const { token, market, proveedor, evaluador, otro } = await deploy();
      const id = await crearJob(
        market,
        evaluador.account.address,
        proveedor.account.address
      );
      await token.write.approve([market.address, BUDGET]);
      await market.write.fund([id]);

      const mOtro = await marketAs(market.address, otro);
      await expect(
        mOtro.write.submit([id, DELIVERABLE])
      ).to.be.rejectedWith("NotProvider");
    });

    it("complete solo lo puede llamar el evaluador", async function () {
      const { token, market, proveedor, evaluador, otro } = await deploy();
      const id = await crearJob(
        market,
        evaluador.account.address,
        proveedor.account.address
      );
      await token.write.approve([market.address, BUDGET]);
      await market.write.fund([id]);
      const mProv = await marketAs(market.address, proveedor);
      await mProv.write.submit([id, DELIVERABLE]);

      const mOtro = await marketAs(market.address, otro);
      await expect(
        mOtro.write.complete([id, REASON])
      ).to.be.rejectedWith("NotEvaluator");
    });

    it("el evaluador no puede rechazar mientras esta en Open", async function () {
      const { market, proveedor, evaluador } = await deploy();
      const id = await crearJob(
        market,
        evaluador.account.address,
        proveedor.account.address
      );
      // en Open solo el cliente puede rechazar
      const mEval = await marketAs(market.address, evaluador);
      await expect(mEval.write.reject([id, REASON])).to.be.rejectedWith("NotClient");
    });
  });

  describe("Multisig como evaluador", function () {
    it("complete solo pasa cuando el Multisig llega al threshold y ejecuta", async function () {
      const { token, market, cliente, proveedor, s1, s2, s3 } = await deploy();

      // despliego el Multisig de la Entrega 2 con 3 signers y threshold 2
      const ms = await hre.viem.deployContract("Multisig", [
        [s1.account.address, s2.account.address, s3.account.address],
        2n,
      ]);

      // creo un job con el Multisig como evaluador, lo fondeo y entrego
      const id = await crearJob(market, ms.address, proveedor.account.address);
      await token.write.approve([market.address, BUDGET]);
      await market.write.fund([id]);
      const mProv = await marketAs(market.address, proveedor);
      await mProv.write.submit([id, DELIVERABLE]);

      // un signer suelto NO es el evaluador: complete directo revierte
      const mS1 = await marketAs(market.address, s1);
      await expect(mS1.write.complete([id, REASON])).to.be.rejectedWith("NotEvaluator");

      // armo la calldata de complete(id, reason) para que la ejecute el Multisig
      const data = encodeFunctionData({
        abi: market.abi,
        functionName: "complete",
        args: [id, REASON],
      });

      // signer 1 propone que el Multisig llame a complete sobre el marketplace
      const msS1 = await multisigAs(ms.address, s1);
      await msS1.write.propose([market.address, 0n, data]);

      // con una sola aprobacion todavia no alcanza el threshold
      await msS1.write.approve([0n]);
      await expect(msS1.write.execute([0n])).to.be.rejectedWith("Faltan aprobaciones");
      let [, , , , , , status] = await market.read.getJob([id]);
      expect(status).to.equal(Submitted); // sigue sin completarse

      // signer 2 aprueba -> llegamos a 2 de 3
      const msS2 = await multisigAs(ms.address, s2);
      await msS2.write.approve([0n]);

      // ahora si: el Multisig ejecuta y el marketplace lo ve como evaluador
      const antes = await token.read.balanceOf([proveedor.account.address]);
      await msS1.write.execute([0n]);
      const despues = await token.read.balanceOf([proveedor.account.address]);

      expect(despues - antes).to.equal(BUDGET);
      [, , , , , , status] = await market.read.getJob([id]);
      expect(status).to.equal(Completed);
    });
  });
});
