# Blockchain Pharma Tracking System / PharmaChain Trace

Дипломный MVP для отслеживания лекарственных препаратов в цепочке поставок.
Система использует Solidity smart contract как источник истины для ролей, владения, статусов и истории продуктов.
React-интерфейс взаимодействует с контрактом через MetaMask. Spring Boot backend хранит дополнительные метаданные и audit logs.

---

## О программе

**Название программы:** Blockchain Pharma Tracking System (PharmaChain Trace)

**Что делает программа:**
Система отслеживает движение лекарственных препаратов от производителя до аптеки.
Подлинность каждого продукта верифицируется по неизменяемой истории в блокчейне.
Регулятор может отозвать опасную партию, и все непроданные продукты блокируются немедленно.
Потребитель проверяет продукт по серийному номеру или QR-коду без регистрации.

**Для кого предназначена:** производители лекарств, дистрибьюторы, аптеки, регуляторы (Росздравнадзор), конечные потребители.

**Тип приложения:** веб-приложение (SPA) + REST API + Solidity Smart Contract + PostgreSQL

---

## Структура каталогов

```
contracts/    Solidity smart contract, Hardhat config, deploy scripts, тесты
frontend/     React + Vite + TypeScript + TailwindCSS + ethers.js
backend/      Java Spring Boot + PostgreSQL + Swagger/OpenAPI
docs/         Описание архитектуры, API, контракта, безопасности, деплоя
architecture/ Диаграммы: компонентная, ER, sequence, use-case, deployment
```
---

## Быстрый запуск

### 1. Smart contract (локальный Hardhat)

```bash
cd contracts
npm install
npm test           # 9 тест-кейсов
npm run node       # запустить локальную ноду на localhost:8545
```

В другом терминале:

```bash
cd contracts
npm run deploy:local
# Скопировать адрес контракта в frontend/.env -> VITE_CONTRACT_ADDRESS=0x...
```

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
# Открыть http://localhost:5173
```

### Docker Compose (всё сразу, кроме контракта)

```bash
docker compose up
```

Поднимает: PostgreSQL 16, Spring Boot 3.3.2 backend (порт 8080), React frontend через nginx (порт 5173).
Контракт деплоится отдельно (Hardhat).

---

## Environment-файлы

`contracts/.env`:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
POLYGON_AMOY_RPC_URL=https://polygon-amoy.infura.io/v3/YOUR_KEY
PRIVATE_KEY=YOUR_TEST_WALLET_PRIVATE_KEY
```

`frontend/.env`:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
VITE_API_BASE_URL=http://localhost:8080/api
VITE_CHAIN_ID=31337
```

---

## Тесты

```bash
# Smart contract (Hardhat, Chai)
cd contracts && npm test

# Backend (Spring Boot, H2 in-memory)
cd backend && mvn test

# Frontend (Vitest)
cd frontend && npm test
```

Smart contract тесты (9 сценариев): создание партии/продукта, дублирование серийного номера, передача между авторизованными акторами, anti-replay operationId, продажа только аптекой, recall/unrecall, иммутабельная история.

---

## Безопасность

- JWT HS256 (кастомная реализация без JJWT): заголовок + payload + HmacSHA256 подпись;
- refresh tokens хранятся как SHA-хеш в PostgreSQL;
- роли проверяются on-chain через OpenZeppelin AccessControl (нельзя подделать JWT-роль без смарт-контракта);
- отозванные продукты блокируются (`blocked = true`), операции с ними reverted;
- `operationId` anti-replay: каждая транзакция требует уникального bytes32;
- CORS настроен на конкретный frontend origin;
- SQL-инъекции исключены через JPA (параметризованные запросы);
- дедупликация событий индексера через уникальный индекс.

