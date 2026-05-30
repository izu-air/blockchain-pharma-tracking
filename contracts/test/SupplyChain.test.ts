import { expect } from "chai";
import { ethers } from "hardhat";

function op(label: string) {
  return ethers.id(`${label}-${Date.now()}-${Math.random()}`);
}

describe("SupplyChain", function () {
  async function deployFixture() {
    const [admin, manufacturer, distributor, pharmacy, regulator, consumer, attacker] = await ethers.getSigners();
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    const supplyChain = await SupplyChain.deploy();
    await supplyChain.waitForDeployment();

    const MANUFACTURER_ROLE = await supplyChain.MANUFACTURER_ROLE();
    const DISTRIBUTOR_ROLE = await supplyChain.DISTRIBUTOR_ROLE();
    const PHARMACY_ROLE = await supplyChain.PHARMACY_ROLE();
    const REGULATOR_ROLE = await supplyChain.REGULATOR_ROLE();

    await supplyChain.grantRole(MANUFACTURER_ROLE, manufacturer.address);
    await supplyChain.grantRole(DISTRIBUTOR_ROLE, distributor.address);
    await supplyChain.grantRole(PHARMACY_ROLE, pharmacy.address);
    await supplyChain.grantRole(REGULATOR_ROLE, regulator.address);

    return { supplyChain, admin, manufacturer, distributor, pharmacy, regulator, consumer, attacker };
  }

  async function createBatchAndProduct() {
    const fixture = await deployFixture();
    const { supplyChain, manufacturer } = fixture;
    const now = Math.floor(Date.now() / 1000);
    const temperatureHash = ethers.id("2-8C temperature log");
    const metadataHash = ethers.id("batch metadata");

    await supplyChain.connect(manufacturer).createBatch(now, now + 365 * 24 * 60 * 60, temperatureHash, metadataHash);
    await supplyChain.connect(manufacturer).createProduct(1, "Paracetamol 500mg", "SN-DEMO-001");
    return fixture;
  }

  it("allows only manufacturers to create batches and products", async function () {
    const { supplyChain, manufacturer, attacker } = await deployFixture();
    const now = Math.floor(Date.now() / 1000);

    await expect(
      supplyChain.connect(attacker).createBatch(now, now + 1000, ethers.id("temp"), ethers.id("meta"))
    ).to.be.reverted;

    await expect(
      supplyChain.connect(manufacturer).createBatch(now, now + 1000, ethers.id("temp"), ethers.id("meta"))
    ).to.emit(supplyChain, "BatchCreated");

    await expect(
      supplyChain.connect(manufacturer).createProduct(1, "Aspirin 100mg", "SN-ASP-001")
    ).to.emit(supplyChain, "ProductCreated");
  });

  it("prevents duplicate serial numbers", async function () {
    const { supplyChain, manufacturer } = await createBatchAndProduct();

    await expect(
      supplyChain.connect(manufacturer).createProduct(1, "Counterfeit Paracetamol", "SN-DEMO-001")
    ).to.be.revertedWith("Serial number already exists");
  });

  it("transfers product only between authorized actors", async function () {
    const { supplyChain, manufacturer, distributor, consumer } = await createBatchAndProduct();

    await expect(
      supplyChain.connect(manufacturer).transferProduct(1, consumer.address, op("bad-transfer"))
    ).to.be.revertedWith("New owner is not an authorized supply actor");

    await expect(
      supplyChain.connect(manufacturer).transferProduct(1, distributor.address, op("transfer"))
    ).to.emit(supplyChain, "ProductTransferred");

    const product = await supplyChain.getProduct(1);
    const sameProduct = await supplyChain.getProductBySerial("SN-DEMO-001");
    expect(product.currentOwner).to.equal(distributor.address);
    expect(sameProduct.id).to.equal(1);
    expect(product.status).to.equal(1);
  });

  it("prevents operation id replay", async function () {
    const { supplyChain, manufacturer, distributor, pharmacy } = await createBatchAndProduct();
    const operationId = op("replay");

    await supplyChain.connect(manufacturer).transferProduct(1, distributor.address, operationId);

    await expect(
      supplyChain.connect(distributor).transferProduct(1, pharmacy.address, operationId)
    ).to.be.revertedWith("Operation id already used");
  });

  it("allows only pharmacy to mark product as sold", async function () {
    const { supplyChain, manufacturer, distributor, pharmacy } = await createBatchAndProduct();

    await supplyChain.connect(manufacturer).transferProduct(1, distributor.address, op("m-to-d"));
    await supplyChain.connect(distributor).updateStatus(1, 2, op("delivered-by-distributor"));

    await expect(
      supplyChain.connect(distributor).updateStatus(1, 3, op("bad-sale"))
    ).to.be.revertedWith("Only pharmacy can mark sold");

    await supplyChain.connect(distributor).transferProduct(1, pharmacy.address, op("d-to-p"));
    await supplyChain.connect(pharmacy).updateStatus(1, 2, op("delivered-by-pharmacy"));
    await supplyChain.connect(pharmacy).updateStatus(1, 3, op("sold"));

    const product = await supplyChain.getProduct(1);
    expect(product.status).to.equal(3);
  });

  it("recalls a batch O(1) and blocks downstream operations", async function () {
    const { supplyChain, manufacturer, distributor, pharmacy, regulator } = await createBatchAndProduct();

    await supplyChain.connect(manufacturer).transferProduct(1, distributor.address, op("m-to-d"));
    await supplyChain.connect(distributor).transferProduct(1, pharmacy.address, op("d-to-p"));

    // recallBatch flips a single flag — no per-product loop, no per-product
    // event emitted.  Should remain a single BatchRecalled event.
    const tx = await supplyChain.connect(regulator)
        .recallBatch(1, "Temperature violation", op("recall"));
    const receipt = await tx.wait();
    const productStatusEvents = receipt.logs
        .map(l => { try { return supplyChain.interface.parseLog(l as never); } catch { return null; } })
        .filter(e => e?.name === "ProductStatusUpdated");
    expect(productStatusEvents.length).to.equal(0);

    // Downstream operation reverts with the new batch-level message.
    await expect(
      supplyChain.connect(pharmacy).updateStatus(1, 3, op("sale-after-recall"))
    ).to.be.revertedWith("Product batch is recalled");

    const verification = await supplyChain.verifyProduct(1);
    expect(verification.authentic).to.equal(true);
    expect(verification.recalled).to.equal(true);
    // Effective blocked = product.blocked || batch.recalled  → true after batch recall
    expect(verification.blocked).to.equal(true);
    // Per-product lifecycle preserved — status not destructively mutated
    const product = await supplyChain.getProduct(1);
    expect(product.status).to.equal(1); // InTransit, not Recalled (4)
  });

  it("allows regulator to unrecall a batch and preserves per-product status", async function () {
    const { supplyChain, manufacturer, distributor, regulator } = await createBatchAndProduct();

    await supplyChain.connect(manufacturer).transferProduct(1, distributor.address, op("m-to-d-unrecall"));
    const statusBefore = (await supplyChain.getProduct(1)).status;

    await supplyChain.connect(regulator)
        .recallBatch(1, "Temperature violation", op("recall-before-unrecall"));
    await expect(
      supplyChain.connect(regulator).unrecallBatch(1, "Investigation cleared batch", op("unrecall"))
    ).to.emit(supplyChain, "BatchUnrecalled");

    const verification = await supplyChain.verifyProductBySerial("SN-DEMO-001");
    expect(verification.recalled).to.equal(false);
    expect(verification.blocked).to.equal(false);

    // Per-product status survived the round-trip unchanged.
    const statusAfter = (await supplyChain.getProduct(1)).status;
    expect(statusAfter).to.equal(statusBefore);
  });

  it("allows regulator to block a single product without recalling the batch", async function () {
    const { supplyChain, manufacturer, distributor, pharmacy, regulator } = await createBatchAndProduct();

    await supplyChain.connect(manufacturer).transferProduct(1, distributor.address, op("m-to-d-block"));

    await expect(
      supplyChain.connect(regulator).blockProduct(1, "Suspicious individual unit", op("block-1"))
    ).to.emit(supplyChain, "ProductBlocked");

    // Batch flag is unchanged
    const batch = await supplyChain.getBatch(1);
    expect(batch.recalled).to.equal(false);

    // Per-product operation is blocked
    await expect(
      supplyChain.connect(distributor).transferProduct(1, pharmacy.address, op("after-block"))
    ).to.be.revertedWith("Product is blocked");

    // Verification reflects the block
    const verification = await supplyChain.verifyProduct(1);
    expect(verification.blocked).to.equal(true);
    expect(verification.recalled).to.equal(false);

    // Unblock makes it usable again
    await expect(
      supplyChain.connect(regulator).unblockProduct(1, "Re-tested OK", op("unblock-1"))
    ).to.emit(supplyChain, "ProductUnblocked");
    const after = await supplyChain.verifyProduct(1);
    expect(after.blocked).to.equal(false);
  });

  it("rejects non-regulator block / unblock", async function () {
    const { supplyChain, manufacturer, attacker } = await createBatchAndProduct();

    await expect(
      supplyChain.connect(manufacturer).blockProduct(1, "x", op("nope-block"))
    ).to.be.reverted;
    await expect(
      supplyChain.connect(attacker).unblockProduct(1, "x", op("nope-unblock"))
    ).to.be.reverted;
  });

  it("rejects non-regulator recall / unrecall (REGULATOR_ROLE is gated)", async function () {
    // Mirrors the matrix in docs/security.md: only REGULATOR_ROLE can flip
    // batch.recalled.  Manufacturers, distributors, pharmacies and random
    // attackers all hit the AccessControl revert before any state change.
    const { supplyChain, manufacturer, distributor, pharmacy, attacker } =
        await createBatchAndProduct();

    for (const signer of [manufacturer, distributor, pharmacy, attacker]) {
      await expect(
        supplyChain.connect(signer).recallBatch(1, "x", op("nope-recall"))
      ).to.be.reverted;
      await expect(
        supplyChain.connect(signer).unrecallBatch(1, "x", op("nope-unrecall"))
      ).to.be.reverted;
    }
  });

  it("returns immutable product history", async function () {
    const { supplyChain, manufacturer, distributor } = await createBatchAndProduct();

    await supplyChain.connect(manufacturer).transferProduct(1, distributor.address, op("history-transfer"));
    const history = await supplyChain.getProductHistory(1);

    expect(history.length).to.equal(2);
    expect(history[0].action).to.equal("Product created");
    expect(history[1].previousOwner).to.equal(manufacturer.address);
    expect(history[1].newOwner).to.equal(distributor.address);
  });

  it("rejects non-manufacturer batch and product creation", async function () {
    const { supplyChain, regulator, attacker } = await deployFixture();
    const now = Math.floor(Date.now() / 1000);

    await expect(
      supplyChain.connect(regulator).createBatch(now, now + 1000, ethers.id("t"), ethers.id("m"))
    ).to.be.reverted;

    await expect(
      supplyChain.connect(attacker).createProduct(1, "Fake", "SN-FAKE-1")
    ).to.be.reverted;
  });

  it("rejects unauthorized status updates", async function () {
    const { supplyChain, manufacturer, attacker } = await createBatchAndProduct();

    await expect(supplyChain.connect(attacker).updateStatus(1, 2, op("hack"))).to.be.revertedWith(
      "Only current owner can perform this action"
    );

    await expect(supplyChain.connect(manufacturer).updateStatus(1, 3, op("bad-sale"))).to.be.revertedWith(
      "Only pharmacy can mark sold"
    );
  });
});
