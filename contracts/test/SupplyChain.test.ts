import { expect } from "chai";
import { ethers } from "hardhat";

describe("SupplyChain", function () {
  async function deployFixture() {
    const [manufacturer, distributor, pharmacy, consumer] = await ethers.getSigners();
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    const supplyChain = await SupplyChain.deploy();
    await supplyChain.waitForDeployment();
    return { supplyChain, manufacturer, distributor, pharmacy, consumer };
  }

  it("creates a product", async function () {
    const { supplyChain, manufacturer } = await deployFixture();

    await expect(supplyChain.createProduct("Aspirin 100mg"))
      .to.emit(supplyChain, "ProductCreated")
      .withArgs(1, "Aspirin 100mg", manufacturer.address);

    const product = await supplyChain.getProduct(1);
    expect(product.name).to.equal("Aspirin 100mg");
    expect(product.currentOwner).to.equal(manufacturer.address);
    expect(product.status).to.equal(0);
  });

  it("transfers a product and stores history", async function () {
    const { supplyChain, distributor } = await deployFixture();

    await supplyChain.createProduct("Ibuprofen 200mg");
    await supplyChain.transferProduct(1, distributor.address);

    const product = await supplyChain.getProduct(1);
    const history = await supplyChain.getProductHistory(1);

    expect(product.currentOwner).to.equal(distributor.address);
    expect(product.status).to.equal(1);
    expect(history.length).to.equal(2);
  });

  it("allows delivered product to be sold", async function () {
    const { supplyChain, distributor, pharmacy } = await deployFixture();

    await supplyChain.createProduct("Paracetamol 500mg");
    await supplyChain.transferProduct(1, distributor.address);
    await supplyChain.connect(distributor).updateStatus(1, 2);
    await supplyChain.connect(distributor).transferProduct(1, pharmacy.address);
    await supplyChain.connect(pharmacy).updateStatus(1, 2);
    await supplyChain.connect(pharmacy).updateStatus(1, 3);

    const product = await supplyChain.getProduct(1);
    expect(product.status).to.equal(3);
  });

  it("prevents non-owner transfer", async function () {
    const { supplyChain, distributor, consumer } = await deployFixture();

    await supplyChain.createProduct("Amoxicillin 250mg");

    await expect(
      supplyChain.connect(consumer).transferProduct(1, distributor.address)
    ).to.be.revertedWith("Only current owner can perform this action");
  });
});
