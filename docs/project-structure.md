# Updated Project Structure

## Root

- `README.md`: quick project overview and launch instructions.
- `.gitignore`: ignores generated dependencies, builds and environment files.

## contracts

- `contracts/contracts/SupplyChain.sol`: AccessControl smart contract with roles, batches, product history, recall and verification.
- `contracts/test/SupplyChain.test.ts`: Hardhat tests for permissions, transfers, replay prevention, recall and history.
- `contracts/scripts/deploy.ts`: deployment script for local network and testnets.
- `contracts/hardhat.config.ts`: Solidity, network and Etherscan configuration.
- `contracts/package.json`: contract dependencies and scripts.
- `contracts/.env.example`: environment variables for RPC URLs and deployment key.

## frontend

- `frontend/src/lib/contract.ts`: ethers.js ABI and blockchain calls.
- `frontend/src/lib/api.ts`: REST API calls to backend cache/analytics.
- `frontend/src/lib/status.ts`: status labels, badges and date helpers.
- `frontend/src/components/Layout.tsx`: navigation and page shell.
- `frontend/src/components/WalletConnector.tsx`: MetaMask connection and role display.
- `frontend/src/components/ProductCard.tsx`: product, batch and verification summary.
- `frontend/src/components/HistoryTimeline.tsx`: immutable product event timeline.
- `frontend/src/pages/DashboardPage.tsx`: role scenario dashboard and backend analytics.
- `frontend/src/pages/LoginPage.tsx`: MetaMask-focused login page.
- `frontend/src/pages/ManufacturerDashboardPage.tsx`: manufacturer workflow dashboard.
- `frontend/src/pages/DistributorDashboardPage.tsx`: distributor workflow dashboard.
- `frontend/src/pages/PharmacyDashboardPage.tsx`: pharmacy workflow dashboard.
- `frontend/src/pages/RegisterProductPage.tsx`: batch and product registration flow.
- `frontend/src/pages/TransferProductPage.tsx`: product transfer and status update.
- `frontend/src/pages/RecallPage.tsx`: regulator batch recall.
- `frontend/src/pages/HistoryPage.tsx`: product history lookup.
- `frontend/src/pages/VerifyProductPage.tsx`: consumer authenticity verification.
- `frontend/src/pages/AnalyticsPage.tsx`: backend analytics dashboard.
- `frontend/src/pages/ProductDetailsPage.tsx`: product details route.

## backend

- `controller`: REST endpoints.
- `service`: business services for metadata, events, JWT, analytics and audit.
- `repository`: Spring Data JPA repositories.
- `entity`: JPA entities for users, metadata, batch metadata, cached events and audit logs.
- `Organization`: stores demo supply-chain organizations.
- `BlockchainEventIndexerService`: scheduled extension point for blockchain event indexing.
- `dto`: request/response DTOs with validation.
- `exception`: centralized exception handling.

## docs

- `architecture.md`: architecture and trust model.
- `api.md`: REST endpoint documentation.
- `smart-contract.md`: contract logic explanation.
- `gas-and-transaction-flow.md`: gas and transaction flow explanation.
- `blockchain-vs-centralized.md`: diploma comparison chapter.
- `deployment-guide.md`: deployment steps.
- `local-setup.md`: local launch steps.
- `project-structure.md`: file purpose overview.
- `diagrams.md`: Mermaid diagrams.
- `security.md`: security explanation.
- `on-chain-vs-off-chain.md`: data placement explanation.
- `testing.md`: verification commands.
