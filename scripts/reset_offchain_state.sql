-- =============================================================================
-- reset_offchain_state.sql — очистить ВСЕ off-chain записи после рестарта
-- локальной Hardhat-ноды.
--
-- Когда `npx hardhat node` перезапускается, состояние блокчейна теряется
-- (новые batchId / productId снова стартуют с 1), а в PostgreSQL остаются
-- "осколки" от предыдущей сессии.  После применения upsert-фикса
-- (ProductBatchMetadataService / ProductMetadataService) перетирание
-- происходит автоматически, но если хочется ПОЛНОСТЬЮ чистого старта —
-- запусти этот скрипт.
--
-- Безопасно для local-dev.  НЕ запускать на production-БД!
--
-- Применение:
--   docker compose exec -T postgres psql -U postgres -d pharma_chain \
--       < scripts/reset_offchain_state.sql
--
-- Или вручную:
--   psql postgresql://postgres:332018@localhost:5432/pharma_chain \
--       -f scripts/reset_offchain_state.sql
-- =============================================================================

BEGIN;

TRUNCATE TABLE product_events           RESTART IDENTITY CASCADE;
TRUNCATE TABLE product_metadata         RESTART IDENTITY CASCADE;
TRUNCATE TABLE product_batch_metadata   RESTART IDENTITY CASCADE;

-- Сбросить чекпойнт индексатора так, чтобы при следующем тике он
-- начал заново с blockchain.indexer.start-block (или с 0, что одно и
-- то же на свежей Hardhat-ноде).  Альтернатива: POST /api/indexer/reset
-- через REST, если backend уже запущен и есть ADMIN JWT.
UPDATE indexer_state SET last_processed_block = -1 WHERE id = 1;

-- Пользователей не трогаем — иначе придётся заново регистрировать ADMIN
-- через AdminBootstrapService.  Если нужна полная очистка вместе с
-- пользователями: TRUNCATE users, refresh_tokens, auth_nonces;
-- но тогда обязательно перезапусти backend с APP_ADMIN_WALLET, чтобы
-- хоть один ADMIN существовал.

COMMIT;

\echo ''
\echo 'off-chain state reset: 3 metadata/event tables truncated, indexer_state.last_processed_block = -1'
\echo ''
\echo 'next steps:'
\echo '  1. restart backend (mvn spring-boot:run) so a fresh indexer cycle starts'
\echo '  2. on frontend: log in again with MetaMask to get a new JWT'
\echo '  3. recreate test batches/products via /register'
