import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

describe("Multisig", function () {
  async function deploy() {
    const wallets = await hre.viem.getWalletClients();
    const [w1, w2, w3, w4] = wallets;
    const ms = await hre.viem.deployContract("Multisig", [
      [w1.account.address, w2.account.address, w3.account.address],
      2n,
    ]);
    const pub = await hre.viem.getPublicClient();
    return { ms, pub, w1, w2, w3, w4 };
  }

  // helper para que el contrato escriba desde otra wallet
  async function asWallet(addr: `0x${string}`, wallet: any) {
    return hre.viem.getContractAt("Multisig", addr, {
      client: { wallet },
    });
  }

  describe("Constructor", function () {
    it("guarda signers y threshold", async function () {
      const { ms, w1, w2, w3 } = await deploy();
      expect(await ms.read.threshold()).to.equal(2n);
      expect(await ms.read.totalSigners()).to.equal(3n);
      const list = await ms.read.getSigners();
      expect(list.map((s) => getAddress(s))).to.deep.equal([
        getAddress(w1.account.address),
        getAddress(w2.account.address),
        getAddress(w3.account.address),
      ]);
      expect(await ms.read.isSigner([w1.account.address])).to.equal(true);
    });

    it("rechaza threshold mayor a la cantidad de signers", async function () {
      const [w1, w2] = await hre.viem.getWalletClients();
      await expect(
        hre.viem.deployContract("Multisig", [
          [w1.account.address, w2.account.address],
          3n,
        ])
      ).to.be.rejectedWith("Threshold invalido");
    });

    it("rechaza signers repetidos", async function () {
      const [w1] = await hre.viem.getWalletClients();
      await expect(
        hre.viem.deployContract("Multisig", [
          [w1.account.address, w1.account.address],
          1n,
        ])
      ).to.be.rejectedWith("Signer repetido");
    });

    it("rechaza array vacio", async function () {
      await expect(
        hre.viem.deployContract("Multisig", [[], 1n])
      ).to.be.rejectedWith("Sin signers");
    });
  });

  describe("Propose", function () {
    it("un signer crea una propuesta y queda en la lista", async function () {
      const { ms, w1, w4 } = await deploy();
      await ms.write.propose([w4.account.address, parseEther("1"), "0x"]);
      expect(await ms.read.proposalCount()).to.equal(1n);
      const [proposer, to, value, data, approvals, executed, cancelled] =
        await ms.read.getProposal([0n]);
      expect(getAddress(proposer)).to.equal(getAddress(w1.account.address));
      expect(getAddress(to)).to.equal(getAddress(w4.account.address));
      expect(value).to.equal(parseEther("1"));
      expect(data).to.equal("0x");
      expect(approvals).to.equal(0n);
      expect(executed).to.equal(false);
      expect(cancelled).to.equal(false);
    });

    it("un no-signer no puede proponer", async function () {
      const { ms, w4 } = await deploy();
      const msW4 = await asWallet(ms.address, w4);
      await expect(
        msW4.write.propose([w4.account.address, 0n, "0x"])
      ).to.be.rejectedWith("No sos signer");
    });
  });

  describe("Approve", function () {
    it("las aprobaciones suben y nadie aprueba dos veces", async function () {
      const { ms, w2, w4 } = await deploy();
      await ms.write.propose([w4.account.address, 0n, "0x"]);

      await ms.write.approve([0n]);
      let [, , , , a1] = await ms.read.getProposal([0n]);
      expect(a1).to.equal(1n);

      const msW2 = await asWallet(ms.address, w2);
      await msW2.write.approve([0n]);
      let [, , , , a2] = await ms.read.getProposal([0n]);
      expect(a2).to.equal(2n);

      // intento de doble approve
      await expect(ms.write.approve([0n])).to.be.rejectedWith("Ya aprobaste");
    });

    it("un no-signer no puede aprobar", async function () {
      const { ms, w4 } = await deploy();
      await ms.write.propose([w4.account.address, 0n, "0x"]);
      const msW4 = await asWallet(ms.address, w4);
      await expect(msW4.write.approve([0n])).to.be.rejectedWith("No sos signer");
    });
  });

  describe("Execute", function () {
    it("se ejecuta al llegar al threshold y manda el ETH", async function () {
      const { ms, pub, w1, w2, w4 } = await deploy();

      // fondeo el contrato
      await w1.sendTransaction({ to: ms.address, value: parseEther("2") });

      await ms.write.propose([w4.account.address, parseEther("1"), "0x"]);

      await ms.write.approve([0n]);
      const msW2 = await asWallet(ms.address, w2);
      await msW2.write.approve([0n]);

      const antes = await pub.getBalance({ address: w4.account.address });
      await ms.write.execute([0n]);
      const despues = await pub.getBalance({ address: w4.account.address });

      expect(despues - antes).to.equal(parseEther("1"));

      const [, , , , , executed] = await ms.read.getProposal([0n]);
      expect(executed).to.equal(true);
    });

    it("no ejecuta si no se llegó al threshold", async function () {
      const { ms, w4 } = await deploy();
      await ms.write.propose([w4.account.address, 0n, "0x"]);
      await ms.write.approve([0n]);
      await expect(ms.write.execute([0n])).to.be.rejectedWith(
        "Faltan aprobaciones"
      );
    });

    it("no se puede ejecutar dos veces", async function () {
      const { ms, w1, w2, w4 } = await deploy();
      await w1.sendTransaction({ to: ms.address, value: parseEther("1") });

      await ms.write.propose([w4.account.address, parseEther("0.5"), "0x"]);
      await ms.write.approve([0n]);
      const msW2 = await asWallet(ms.address, w2);
      await msW2.write.approve([0n]);
      await ms.write.execute([0n]);

      await expect(ms.write.execute([0n])).to.be.rejectedWith("Ya ejecutada");
    });
  });

  describe("Cancel", function () {
    it("solo el proposer puede cancelar antes de ejecutar", async function () {
      const { ms, w2, w4 } = await deploy();
      await ms.write.propose([w4.account.address, 0n, "0x"]);

      const msW2 = await asWallet(ms.address, w2);
      await expect(msW2.write.cancel([0n])).to.be.rejectedWith(
        "Solo el proposer"
      );

      await ms.write.cancel([0n]);
      const [, , , , , executed, cancelled] = await ms.read.getProposal([0n]);
      expect(cancelled).to.equal(true);
      expect(executed).to.equal(false);
    });

    it("no se puede aprobar una propuesta cancelada", async function () {
      const { ms, w4 } = await deploy();
      await ms.write.propose([w4.account.address, 0n, "0x"]);
      await ms.write.cancel([0n]);
      await expect(ms.write.approve([0n])).to.be.rejectedWith("Cancelada");
    });
  });

  describe("Recibir ETH", function () {
    it("acepta deposits vía receive()", async function () {
      const { ms, pub, w1 } = await deploy();
      const antes = await pub.getBalance({ address: ms.address });
      await w1.sendTransaction({ to: ms.address, value: parseEther("0.5") });
      const despues = await pub.getBalance({ address: ms.address });
      expect(despues - antes).to.equal(parseEther("0.5"));
    });
  });
});
