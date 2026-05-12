-- Hardhat default accounts (chain id 31337) so JWT login matches local MetaMask / Hardhat node out of the box.
INSERT INTO app_users (id, name, role, wallet_address, created_at)
VALUES
  (1, 'Demo Manufacturer', 'MANUFACTURER', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', NOW()),
  (2, 'Demo Distributor', 'DISTRIBUTOR', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', NOW()),
  (3, 'Demo Pharmacy', 'PHARMACY', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', NOW()),
  (4, 'Demo Regulator', 'REGULATOR', '0x90F79bf6EB2c4f870365E785982E1f101E93b906', NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  wallet_address = EXCLUDED.wallet_address;
