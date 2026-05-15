# Инструкция: написание диплома по проекту PharmaChain Trace

Ты в корне репозитория **Blockchain Pharma Tracking System** (рядом: `contracts/`, `frontend/`, `backend/`, `docs/`, `architecture/`, файл `diploma-writer.skill`).

Выполняй шаги **по порядку**. После каждого шага кратко отчитайся: что прочитано / что создано.

---

## ШАГ 1: Распаковать скилл

```bash
python -c "import zipfile; zipfile.ZipFile('diploma-writer.skill').extractall('diploma-writer')"
```

Прочитай файлы скилла:

- `diploma-writer/SKILL.md` — главная инструкция
- `diploma-writer/references/structure.md` — структура диплома
- `diploma-writer/references/style.md` — правила стиля
- `diploma-writer/references/formatting.md` — правила оформления
- `diploma-writer/references/readme_template.md` — шаблон README

---

## ШАГ 2: Изучить код проекта PharmaChain

### Тип системы

Enterprise-прототип отслеживания лекарственных препаратов в цепочке поставок: **веб-приложение + smart contract + REST API + PostgreSQL**.

### Стек (версии — из `pom.json` / `package.json`)

| Слой | Технологии | Где смотреть |
|------|------------|--------------|
| Blockchain | Solidity 0.8.x, Hardhat, OpenZeppelin AccessControl | `contracts/` |
| Backend | Java 17, Spring Boot 3.3.x, JPA, PostgreSQL, Web3j, JWT, Flyway | `backend/` |
| Frontend | React 18, Vite, TypeScript, TailwindCSS, ethers.js v6 | `frontend/` |
| DevOps | Docker Compose, nginx | `docker-compose.yml` |

### Читай в приоритете

**1. Блокчейн (on-chain — ядро главы 2):**

- `contracts/contracts/SupplyChain.sol` — роли, enum Status, события, recall, verify, history, `operationId`
- `contracts/test/SupplyChain.test.ts`
- `contracts/scripts/deploy.ts`
- `contracts/hardhat.config.ts`

**2. Backend (off-chain):**

- `backend/src/main/java/com/diploma/pharma/PharmaSupplyChainApplication.java`
- `backend/src/main/java/com/diploma/pharma/controller/` — Auth, metadata, events, analytics, audit
- `backend/src/main/java/com/diploma/pharma/service/` — Auth, Jwt, RefreshToken, Indexer, Analytics, AuditLog
- `backend/src/main/java/com/diploma/pharma/entity/`, `repository/`
- `backend/src/main/java/com/diploma/pharma/config/SecurityConfig.java`
- `backend/src/main/resources/application.yml`, `data.sql`
- `backend/src/main/resources/db/migration/V1__baseline_schema.sql`

**3. Frontend:**

- `frontend/src/App.tsx` — маршруты
- `frontend/src/lib/contract.ts`, `api.ts`, `auth.ts`, `navigation.ts`
- `frontend/src/pages/` — кабинеты ролей, `/verify`, register, transfer, recall, analytics
- `frontend/src/components/SupplyChainTimeline.tsx`, `Layout.tsx`, `WalletConnector.tsx`

**4. Документация и диаграммы:**

- `docs/architecture.md`, `docs/on-chain-vs-off-chain.md`, `docs/blockchain-vs-centralized.md`
- `docs/smart-contract.md`, `docs/api.md`, `docs/security.md`, `docs/testing.md`, `docs/deployment-guide.md`
- `architecture/component-diagram.md`, `er-diagram.md`, `sequence-product-lifecycle.md`, `deployment-diagram.md`, `use-case-diagram.md`
- `README.md` (если есть)

### Роли (обязательно в дипломе)

| Роль | On-chain | Off-chain (JWT) | UI |
|------|----------|-----------------|-----|
| Manufacturer | `MANUFACTURER_ROLE` | `MANUFACTURER` | `/manufacturer`, `/register` |
| Distributor | `DISTRIBUTOR_ROLE` | `DISTRIBUTOR` | `/distributor`, `/transfer` |
| Pharmacy | `PHARMACY_ROLE` | `PHARMACY` | `/pharmacy`, `/transfer` |
| Regulator | `REGULATOR_ROLE` | `REGULATOR` | `/regulator`, `/recall` |
| Consumer | — (read-only) | `CONSUMER` / публично | `/verify` |

### Ключевой функционал

- создание партии и продукта on-chain + metadata off-chain;
- передача владения (`transferProduct`), state machine статусов: Manufactured → InTransit → Delivered → Sold;
- recall / unrecall партии регулятором;
- consumer verification по serial / QR + supply-chain timeline;
- JWT login + refresh token, audit log, analytics API;
- опциональный Web3j indexer (`eth_getLogs` → `product_events`);
- **разделение on-chain / off-chain** (обоснование blockchain).

### Нетривиальные решения (выделить в дипломе)

- OpenZeppelin `AccessControl` и иерархия ролей;
- глобальный `operationId` anti-replay;
- append-only `productHistories`;
- `bytes32` temperatureHash / metadataHash (off-chain документ → hash on-chain);
- кастомный JWT (HS256) + refresh tokens;
- role-based navigation во frontend;
- восстановление `statusBeforeRecall` при unrecall.

### НЕ читать

`node_modules/`, `target/`, `.git/`, `dist/`, `build/`, `package-lock.json`, `*.min.js`, `backend/package-lock.json`, автогенерированные артефакты.

### Важно (Windows)

Путь с кириллицей в имени папки (например `ДИПЛОМ`) ломает `mvn spring-boot:run` (classpath). В README и дипломе укажи обход:

- перенос проекта в ASCII-путь (`D:\Learn\4\diploma\project`), или
- `mvn package -DskipTests` + `java -jar target/pharma-supply-chain-1.0.0.jar`, или
- `subst X: "...\backend"` и запуск с `X:\`.

---

## ШАГ 3: Составить README.md

Создай или обнови **`README.md` в корне репозитория** по шаблону `diploma-writer/references/readme_template.md`.

Заполни **только из кода**:

- название: Blockchain Pharma Tracking System / PharmaChain Trace;
- проблема: контрафакт, непрозрачность supply chain;
- полный стек с версиями;
- структура каталогов (`contracts/`, `frontend/`, `backend/`, `docs/`, `architecture/`);
- инструкция запуска (Hardhat → deploy → backend → frontend; `docker compose up`);
- роли и сценарии по каждому участнику;
- Swagger: `http://localhost:8080/swagger-ui/index.html`;
- таблица **on-chain vs off-chain**;
- тесты: `cd contracts && npm test`, `cd backend && mvn test`, `cd frontend && npm test`;
- граничные случаи: expired, recall, blocked, duplicate serial, invalid status transition, JWT 401;
- трудозатраты — реалистичная оценка по объёму модулей.

Раздел «Данные автора» — заглушки:

```
ФИО: [ФИО автора]
Группа: [номер группы]
Руководитель: [ФИО руководителя]
Год: [год]
```

Покажи README и спроси:

> Проверь README.md. Исправь данные автора и всё неточное.  
> Когда будет готово — напиши **«готово»**, и я начну писать диплом.

**Жди «готово» перед шагом 4.**

---

## ШАГ 4: Написать диплом

Следуй **`diploma-writer/SKILL.md`** полностью.

Пиши разделы **строго по порядку** из `diploma-writer/references/structure.md`.  
После каждого раздела — самопроверка по чеклисту из SKILL.md.

### Привязка разделов к проекту

| Раздел диплома | Источники в репозитории |
|----------------|-------------------------|
| Анализ предметной области | контрафакт, GxP, pharma supply chain |
| Обоснование blockchain | `docs/blockchain-vs-centralized.md`, `docs/on-chain-vs-off-chain.md` |
| Архитектура системы | `docs/architecture.md`, `architecture/component-diagram.md` |
| Проектирование БД | `V1__baseline_schema.sql`, `architecture/er-diagram.md` |
| Smart contract | `SupplyChain.sol`, `docs/smart-contract.md` |
| Backend | Spring layers, JWT, indexer, Flyway, Swagger |
| Frontend | dashboards, verify, timeline, MetaMask |
| Безопасность | `docs/security.md`, роли, JWT, RBAC |
| Тестирование | `SupplyChain.test.ts`, `mvn test`, сценарии по ролям |
| Развёртывание | `docker-compose.yml`, `docs/deployment-guide.md` |

### Заглушки рисунков

Вставляй в текст:

- `[МЕСТО ДЛЯ РИСУНКА X.X]` — архитектура (component diagram)
- `[МЕСТО ДЛЯ РИСУНКА X.X]` — ER-диаграмма PostgreSQL
- `[МЕСТО ДЛЯ РИСУНКА X.X]` — use case (5 ролей)
- `[МЕСТО ДЛЯ РИСУНКА X.X]` — sequence: создание / transfer / verify
- `[МЕСТО ДЛЯ РИСУНКА X.X]` — deployment (Docker)
- `[МЕСТО ДЛЯ РИСУНКА X.X]` — скриншот: кабинет производителя
- `[МЕСТО ДЛЯ РИСУНКА X.X]` — скриншот: consumer verify + timeline
- `[МЕСТО ДЛЯ РИСУНКА X.X]` — скриншот: регулятор / recall

Mermaid из `architecture/` и `docs/diagrams.md` перерисовать в Visio / draw.io для Word.

### Листинги в основном тексте

Только **нетривиальное**:

- фрагмент `SupplyChain.sol` (state machine, recall, `verifyProduct`);
- `operationId` / append history;
- `SecurityConfig` / JWT flow;
- при необходимости — `BlockchainEventIndexerService.processLog`.

Остальной код — в **приложение**.

### Критические правила (всегда)

- никаких упоминаний ИИ, Claude, GPT, Cursor в тексте диплома;
- длинное тире (—) в предложениях **запрещено**;
- листинги в основном тексте — только для нетривиальных решений;
- диаграммы — заглушки `[МЕСТО ДЛЯ РИСУНКА X.X]`;
- задачи во введении — через **существительные**, не инфинитивы;
- персональные данные — **только из README.md**, ничего не выдумывать;
- явно объяснить **зачем blockchain**, а не «для моды».

---

## ШАГ 5: Сгенерировать Диплом.docx

```bash
pip install python-docx --break-system-packages
python diploma-writer/scripts/generate_docx.py
python diploma-writer/scripts/fix_lists.py --file Диплом.docx --output Диплом.docx
```

Если `generate_docx.py` требует адаптации — настрой под тему:

**«Разработка системы отслеживания лекарственных препаратов в цепочке поставок на основе blockchain-технологий»**

и термины из README (PharmaChain, SupplyChain, роли, on-chain/off-chain).

---

## ШАГ 6: Финальный отчёт

После создания `Диплом.docx` выведи:

```
✅ Диплом.docx создан.

📌 Что нужно сделать вручную:

РИСУНКИ — нарисовать и вставить в Word вместо заглушек:
  [список всех [МЕСТО ДЛЯ РИСУНКА X.X] из документа]
  + скриншоты UI: /manufacturer, /verify?serial=..., /regulator, Swagger UI

ДАННЫЕ АВТОРА — заменить на титульном листе:
  ФИО, группу, руководителя, год

СОДЕРЖАНИЕ — обновить в Word:
  Ctrl+A → F9

ПРИЛОЖЕНИЕ — полные листинги SupplyChain.sol, ключевые фрагменты backend/frontend

📊 Итого:
  Разделов написано: X
  Тест-кейсов: X  (создание, transfer, sold, recall, verify, JWT)
  Листингов в приложении: X
  Источников: X  (GxP, blockchain pharma, Spring Boot, Ethereum/Solidity docs)
```

---

## Шпаргалка: демо на защите

```bash
# Терминал 1 — blockchain
cd contracts
npm install
npm run node

# Терминал 2 — deploy
cd contracts
npm run deploy:local
# → скопировать адрес в frontend/.env → VITE_CONTRACT_ADDRESS=...

# Терминал 3 — backend (при кириллице в пути — java -jar)
cd backend
mvn package -DskipTests
java -jar target/pharma-supply-chain-1.0.0.jar

# Терминал 4 — frontend
cd frontend
npm install
npm run dev
```

**Сценарий защиты:** Manufacturer (register + QR) → Distributor (transfer + Delivered) → Pharmacy (Sold) → Consumer (`/verify?serial=...` + timeline) → Regulator (recall) → повторная verify (recall warning).

**URL:** frontend `http://localhost:5173`, Swagger `http://localhost:8080/swagger-ui/index.html`, Hardhat `http://127.0.0.1:8545`.
