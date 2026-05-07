# Blockchain-based Pharmaceutical Supply Chain Tracking System

Дипломный MVP для отслеживания лекарственных препаратов в цепочке поставок с использованием Solidity smart contract, React-интерфейса, MetaMask и Spring Boot backend.

Интерфейс приложения на русском языке. Код и документация сделаны простыми и читаемыми, чтобы проект можно было объяснить на защите.

## Что демонстрирует проект

- регистрацию лекарственного продукта в блокчейне;
- создание партий лекарственных препаратов;
- передачу владения между участниками цепочки поставок;
- обновление статуса продукта;
- отзыв партии регулятором;
- проверку подлинности по идентификатору;
- просмотр истории продукта;
- проверку срока годности и recall-статуса;
- хранение дополнительной справочной информации в PostgreSQL.

## Участники

- Manufacturer: создает партии и продукты.
- Distributor: получает и передает продукт.
- Pharmacy: получает продукт и отмечает продажу.
- Regulator: отзывает небезопасные партии.
- Consumer: проверяет подлинность и историю.

## Структура

```text
contracts/  Solidity contract, Hardhat config, deploy scripts, tests
frontend/   React + Vite + TypeScript + TailwindCSS + ethers.js
backend/    Java Spring Boot + PostgreSQL + Swagger/OpenAPI
docs/       Architecture, API, contract, deployment and local setup docs
```

## Быстрый локальный запуск

### 1. Smart contract

```bash
cd contracts
npm install
npm test
npm run node
```

В другом терминале:

```bash
cd contracts
npm run deploy:local
```

Скопируйте адрес контракта в `frontend/.env`.

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

Swagger UI: `http://localhost:8080/swagger-ui/index.html`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Откройте `http://localhost:5173`.

## Environment файлы

Создайте `contracts/.env`:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
POLYGON_AMOY_RPC_URL=https://polygon-amoy.infura.io/v3/YOUR_KEY
PRIVATE_KEY=YOUR_TEST_WALLET_PRIVATE_KEY
ETHERSCAN_API_KEY=OPTIONAL
POLYGONSCAN_API_KEY=OPTIONAL
```

Создайте `frontend/.env`:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
VITE_API_BASE_URL=http://localhost:8080/api
```

## Почему такая архитектура

Blockchain является источником истины для ролей, партий, владения, статуса, recall и истории продукта. Backend не дублирует эту бизнес-логику, а хранит только дополнительные сведения: описание, номер партии, analytics, audit logs и кэш transaction hashes для демонстрации интеграции с классическим web backend.

Подробности находятся в папке `docs/`.

## Ключевые дипломные улучшения

- OpenZeppelin `AccessControl` с ролями администратора, производителя, дистрибьютора, аптеки и регулятора.
- Batch system с hash температурного журнала и hash метаданных.
- Immutable product history с actor, timestamp, previous owner, new owner и operation id.
- Recall mechanism: отозванная партия блокирует непроданные продукты.
- Consumer verification: подлинность, текущий владелец, срок годности, recall warning и timeline.
- Backend analytics, audit logs, product search и демонстрационный JWT по wallet address.
- QR-код проверки продукта по serial number.
- Mermaid-диаграммы архитектуры, transfer flow, verification flow и database schema.
