import { ethers } from "hardhat";

/**
 * Deploys SupplyChain and, when running against the local Hardhat node,
 * grants role assignments to the canonical demo accounts so the diploma
 * demo can show a realistic four-actor flow without manual setup.
 *
 *   Account #0  →  DEPLOYER (gets ALL roles from the constructor)
 *   Account #1  →  MANUFACTURER_ROLE  (additional manufacturer for demos)
 *   Account #2  →  DISTRIBUTOR_ROLE
 *   Account #3  →  PHARMACY_ROLE
 *   Account #4  →  REGULATOR_ROLE
 *
 * For non-local networks (chainId != 31337) only the contract is deployed —
 * production role assignment must go through a multisig / governance flow.
 */
async function main() {
  const SupplyChain = await ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.waitForDeployment();

  const address = await supplyChain.getAddress();
  const network = await ethers.provider.getNetwork();
  console.log(`SupplyChain deployed to: ${address}`);
  console.log(`Network: chainId=${network.chainId}`);

  // Skip role bootstrap on real networks — production should use multisig.
  if (network.chainId !== 31337n) {
    console.log("Non-local network: skipping demo role assignment.");
    return;
  }

  const signers = await ethers.getSigners();
  if (signers.length < 5) {
    console.log("Not enough signers for full demo role assignment.");
    return;
  }
  const [deployer, manufacturer, distributor, pharmacy, regulator] = signers;

  const grants: Array<{ role: string; account: string; label: string }> = [
    { role: await supplyChain.MANUFACTURER_ROLE(), account: manufacturer.address, label: "MANUFACTURER -> #1" },
    { role: await supplyChain.DISTRIBUTOR_ROLE(),  account: distributor.address,  label: "DISTRIBUTOR  -> #2" },
    { role: await supplyChain.PHARMACY_ROLE(),     account: pharmacy.address,     label: "PHARMACY     -> #3" },
    { role: await supplyChain.REGULATOR_ROLE(),    account: regulator.address,    label: "REGULATOR    -> #4" }
  ];

  for (const g of grants) {
    const tx = await supplyChain.connect(deployer).grantRole(g.role, g.account);
    await tx.wait();
    console.log(`  granted ${g.label}  (${g.account})`);
  }

  console.log("\nDemo accounts ready.  Import these private keys into MetaMask:");
  console.log(`  #0 deployer (all roles):  ${deployer.address}`);
  console.log(`  #1 manufacturer:          ${manufacturer.address}`);
  console.log(`  #2 distributor:           ${distributor.address}`);
  console.log(`  #3 pharmacy:              ${pharmacy.address}`);
  console.log(`  #4 regulator:             ${regulator.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
