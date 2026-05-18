# Blockchain Pharma Tracking System / PharmaChain Trace

Дипломный MVP для отслеживания лекарственных препаратов в цепочке поставок.
Система использует Solidity smart contract как источник истины для ролей, владения, статусов и истории продуктов.
React-интерфейс взаимодействует с контрактом через MetaMask. Spring Boot backend хранит дополнительные метаданные и audit logs.

> **Что обязательно прочитать перед запуском / демо:**
>
> | Тема | Файл |
> |---|---|
> | Локальный запуск | [`docs/local-setup.md`](docs/local-setup.md) |
> | Production deployment | [`docs/deployment-guide.md`](docs/deployment-guide.md) |
> | Модель безопасности / SIWE login | [`docs/security.md`](docs/security.md) |
> | Разные ID (blockchain vs business vs DB) | [`docs/id-model.md`](docs/id-model.md) |
> | QR threat model | [`docs/qr-verification.md`](docs/qr-verification.md) |
> | Тестирование на телефоне | [`docs/mobile-testing.md`](docs/mobile-testing.md) |
> | Индексатор on-chain событий | [`docs/indexer.md`](docs/indexer.md) |

## Quick start

```bash
# 1. Local Hardhat node + contract deploy
cd contracts && npm install && npm run node                       # terminal A
cd contracts && npm run deploy:local                              # terminal B

# 2. Backend (Postgres локально; fallback postgres/postgres)
cd backend && mvn spring-boot:run
# JWT_SECRET генерируется как ephemeral random + WARN, если переменная не задана.

# 3. Frontend
cd frontend && cp .env.example .env && npm install && npm run dev
# Откройте http://localhost:5173, подключите MetaMask hardhat-аккаунтом,
# нажмите «Войти подписью кошелька» → JWT выдан.
```

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

## Стек технологий

| Слой | Технологии | Версии |
|---|---|---|
| Blockchain | Solidity, Hardhat, OpenZeppelin AccessControl | Solidity 0.8.24, Hardhat 2.22.6 |
| Backend | Java, Spring Boot, Spring Security, JPA, Flyway | Java 17, Spring Boot 3.3.2 |
| Backend (дополнительно) | Web3j, SpringDoc OpenAPI, PostgreSQL | Web3j 4.10.3, SpringDoc 2.6.0, PostgreSQL 16 |
| Frontend | React, TypeScript, Vite, TailwindCSS, ethers.js | React 18.3.1, TypeScript 5.5.3, ethers.js 6.13.2 |
| DevOps | Docker Compose, nginx | Docker Compose v2 |

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

## Функциональные требования

- регистрация пользователей по адресу Ethereum-кошелька;
- вход в систему с получением JWT-токена;
- создание партии лекарственных препаратов on-chain;
- создание продукта внутри партии с уникальным серийным номером on-chain;
- передача владения продуктом между участниками цепочки (Manufacturer → Distributor → Pharmacy);
- обновление статуса продукта (Manufactured, InTransit, Delivered, Sold);
- отзыв (recall) и восстановление (unrecall) партии регулятором;
- потребительская верификация продукта по серийному номеру или QR-коду;
- просмотр полной истории движения продукта (supply chain timeline);
- хранение дополнительных метаданных (описание, номер партии, хеш температурного журнала) off-chain;
- audit log всех действий в системе;
- аналитика: счётчики продуктов, партий, событий;
- индексация событий блокчейна в PostgreSQL (Web3j, опционально).

---

## Роли пользователей

| Роль | On-chain роль | Off-chain (JWT) | Основные экраны |
|---|---|---|---|
| Производитель (Manufacturer) | MANUFACTURER_ROLE | MANUFACTURER | /manufacturer, /register |
| Дистрибьютор (Distributor) | DISTRIBUTOR_ROLE | DISTRIBUTOR | /distributor, /transfer |
| Аптека (Pharmacy) | PHARMACY_ROLE | PHARMACY | /pharmacy, /transfer |
| Регулятор (Regulator) | REGULATOR_ROLE | REGULATOR | /recall |
| Потребитель (Consumer) | нет (read-only) | не требуется | /verify |

---

## Маршруты приложения

| Маршрут | Страница | Доступ |
|---|---|---|
| / | Главный дашборд | Все |
| /login | Вход | Все |
| /manufacturer | Кабинет производителя | Manufacturer |
| /distributor | Кабинет дистрибьютора | Distributor |
| /pharmacy | Кабинет аптеки | Pharmacy |
| /register | Регистрация продукта | Manufacturer |
| /transfer | Передача продукта | Manufacturer, Distributor, Pharmacy |
| /recall | Отзыв партии | Regulator |
| /history | История продукта | Авторизованные |
| /products/:id | Детали продукта | Все |
| /verify | Верификация (consumer) | Все, публично |
| /analytics | Аналитика | Авторизованные |

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

## On-chain vs Off-chain

| Данные | Где хранится | Причина |
|---|---|---|
| Роли участников | On-chain (AccessControl) | Должны быть проверяемы без доверия к серверу |
| Партии (batch): даты, хеши | On-chain | Источник истины для верификации |
| Продукт: серийный номер, владелец, статус | On-chain | Подлинность и текущее состояние |
| История движения (productHistories) | On-chain (append-only) | Неизменяемый аудит |
| Recall-статус партии | On-chain | Видим всем участникам немедленно |
| Хеш температурного журнала | On-chain (bytes32) | Документ off-chain, но хеш неизменяем |
| Хеш метаданных партии | On-chain (bytes32) | Проверка целостности документа |
| Описания, номера партий | Off-chain (PostgreSQL) | Не требуют доверия, нужны для UI |
| Audit logs | Off-chain (PostgreSQL) | Для аналитики, большой объём |
| Кэш transaction hashes | Off-chain (PostgreSQL) | Быстрый поиск |
| Analytics | Off-chain (PostgreSQL) | Агрегации, не критичны для trust |
| Refresh tokens | Off-chain (PostgreSQL) | Стандартная сессионная логика |

---

## Нетривиальные решения

**Smart contract:**
- OpenZeppelin `AccessControl` с иерархией: `DEFAULT_ADMIN_ROLE` управляет `ADMIN_ROLE`, `ADMIN_ROLE` управляет всеми ролями участников;
- глобальный `operationId` (bytes32) как anti-replay защита: каждая бизнес-операция (transfer, recall) требует уникального идентификатора;
- append-only `productHistories`: записи только добавляются, не редактируются;
- `bytes32 temperatureHash` и `metadataHash`: хранение хешей off-chain документов on-chain для проверки целостности;
- `verifyProduct` возвращает `VerificationResult` с флагами `authentic`, `recalled`, `expired`, `blocked` за один вызов;
- `unrecallBatch` восстанавливает статус продукта в `InTransit` (не в исходный статус до отзыва).

**Backend:**
- кастомная реализация JWT HS256 без внешних библиотек (JJWT): вручную base64url + HmacSHA256 в `JwtService`;
- `JwtAuthenticationFilter` как Spring Security filter до `UsernamePasswordAuthenticationFilter`;
- `BlockchainEventIndexerService`: фоновая служба на Web3j, читает `eth_getLogs`, пишет в `product_events`;
- дедупликация событий индексера через уникальный индекс `(transaction_hash, event_type, blockchain_product_id)`.

**Frontend:**
- `operationId` генерируется на клиенте через `solidityPackedKeccak256(["string","uint256"], [label + UUID, Date.now()])`;
- role-based navigation: `WalletConnector` читает роли из контракта через `hasRole()`;
- `SupplyChainTimeline` рендерит историю продукта из `productHistories` on-chain.

---

## Граничные случаи для тест-кейсов

### Авторизация

| Сценарий | Ожидаемый результат |
|---|---|
| Вход с незарегистрированным wallet_address | HTTP 401 / 404 |
| POST /api/** без JWT токена | HTTP 401, JSON: `{"error":"Unauthorized"}` |
| Запрос с истёкшим JWT | HTTP 401 |
| Запрос с невалидной подписью JWT | HTTP 401 |

### Smart contract

| Сценарий | Ожидаемый результат |
|---|---|
| Создание партии не-производителем | revert AccessControl |
| Создание продукта с уже существующим серийным номером | revert "Serial number already exists" |
| Передача продукта потребителю (не supply actor) | revert "New owner is not an authorized supply actor" |
| Повторное использование operationId | revert "Operation id already used" |
| Продажа (sold) не аптекой | revert "Only pharmacy can mark sold" |
| Продажа продукта без статуса Delivered | revert "Product must be delivered before sold" |
| Операция с отозванным (recalled) продуктом | revert "Product is blocked" |
| Передача уже проданного продукта | revert "Sold product cannot be transferred" |
| Верификация несуществующего серийного номера | revert "Product does not exist" |
| Верификация с истёкшим `expirationDate` | `VerificationResult.expired = true` |

### Ролевой доступ

| Сценарий | Ожидаемый результат |
|---|---|
| Recall партии не-регулятором | revert AccessControl |
| Повторный recall уже отозванной партии | revert "Batch already recalled" |
| Unrecall не-отозванной партии | revert "Batch is not recalled" |

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

## Трудозатраты

| Этап | Трудозатраты (часов) |
|---|---|
| Анализ требований и проектирование | 40 |
| Smart contract (Solidity + тесты) | 50 |
| Backend (Spring Boot + JWT + Flyway + Indexer) | 80 |
| Frontend (React + ethers.js + UI кабинеты) | 70 |
| Тестирование и отладка | 30 |
| Документирование | 20 |
| **Итого** | **290** |

Разрабатывал: один человек.

---

## Аналоги

| Решение | Что умеет | Чего нет |
|---|---|---|
| MediLedger Network | Blockchain tracking крупных фармкомпаний | Закрытая сеть, недоступна для учёбы |
| IBM Food Trust | Supply chain на Hyperledger Fabric | Требует enterprise инфраструктуры |
| SAP Advanced Track and Trace | Централизованная БД tracking | Нет блокчейна, нет consumer verify |
| Chronicled | Blockchain pharma, DSCSA compliance | Коммерческий SaaS, закрытый API |
| TraceLink | Сериализация и track&trace | Централизованный, нет recall on-chain |

Ни одно из перечисленных решений не предоставляет открытый исходный код для учебного воспроизведения.

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

---

## Персональные данные автора

**ФИО:** [ФИО автора]
**Группа:** [номер группы]
**Руководитель:** [ФИО руководителя]
**Год:** [год]
**Специальность:** 09.02.07 Информационные системы и программирование
