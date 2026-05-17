import { ethers } from "hardhat";

/**
 * Грантит роль на уже задеплоенном контракте.
 *
 * Запуск:
 *   npx hardhat run scripts/grantRole.ts --network localhost \
 *     -- <CONTRACT_ADDR> <ROLE> <RECIPIENT>
 *
 * Пример (выдать роль производителя текущему аккаунту MetaMask):
 *   npx hardhat run scripts/grantRole.ts --network localhost \
 *     -- 0x5FbDB... MANUFACTURER 0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199
 *
 * Допустимые имена ролей: ADMIN | MANUFACTURER | DISTRIBUTOR | PHARMACY | REGULATOR.
 * Подписывает deployer (Account #0), у него ADMIN_ROLE'ы.
 */
async function main() {
  const args = process.argv.slice(2);
  // hardhat помещает свои флаги перед "--", поэтому ищем последние 3 аргумента
  const trailing = args.slice(-3);
  if (trailing.length !== 3) {
    throw new Error(
      "Usage: hardhat run scripts/grantRole.ts --network localhost -- <CONTRACT> <ROLE> <RECIPIENT>"
    );
  }
  const [contractAddress, roleName, recipient] = trailing;

  const supplyChain = await ethers.getContractAt("SupplyChain", contractAddress);

  const roleMap: Record<string, () => Promise<string>> = {
    ADMIN:        () => supplyChain.ADMIN_ROLE(),
    MANUFACTURER: () => supplyChain.MANUFACTURER_ROLE(),
    DISTRIBUTOR:  () => supplyChain.DISTRIBUTOR_ROLE(),
    PHARMACY:     () => supplyChain.PHARMACY_ROLE(),
    REGULATOR:    () => supplyChain.REGULATOR_ROLE()
  };
  const resolver = roleMap[roleName.toUpperCase()];
  if (!resolver) {
    throw new Error(`Unknown role "${roleName}". Use one of: ${Object.keys(roleMap).join(", ")}`);
  }
  const roleHash = await resolver();

  const [signer] = await ethers.getSigners();
  console.log(`Signer (must be admin):  ${signer.address}`);
  console.log(`Contract:                ${contractAddress}`);
  console.log(`Role:                    ${roleName} (${roleHash})`);
  console.log(`Recipient:               ${recipient}`);

  const tx = await supplyChain.connect(signer).grantRole(roleHash, recipient);
  const receipt = await tx.wait();
  console.log(`\n  granted in tx ${receipt?.hash}`);

  const hasRole = await supplyChain.hasRole(roleHash, recipient);
  console.log(`  hasRole(${roleName}, ${recipient}) = ${hasRole}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
