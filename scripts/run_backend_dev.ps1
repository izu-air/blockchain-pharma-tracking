# =============================================================================
# run_backend_dev.ps1 — запуск backend для локальной разработки/демо.
#
# Что устанавливает:
#   * APP_ADMIN_WALLET  — кошелёк, который при старте backend получает роль
#                          ADMIN.  Это hardhat-аккаунт #0 (deployer).
#   * JWT_SECRET        — стабильный секрет, чтобы JWT-токены НЕ
#                          инвалидировались при каждом рестарте.
#   * BLOCKCHAIN_*      — настройки индексатора (см. /api/indexer/reset).
#   * AUDIT_PEPPER      — pepper для HMAC-псевдонимизации wallet в
#                          audit_logs.
#
# Запуск:
#   cd backend
#   ..\scripts\run_backend_dev.ps1
#
# Безопасно ТОЛЬКО для local-dev: эти "секреты" — не секреты.  На
# production задавай env через docker compose / systemd / vault.
# =============================================================================

# Hardhat account #0 — он же deployer контракта и владелец DEFAULT_ADMIN_ROLE.
# Если в MetaMask импортируешь его приватный ключ
#   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
# то этот же адрес автоматически станет ADMIN в backend.
$env:APP_ADMIN_WALLET = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
$env:APP_ADMIN_NAME   = "Local-dev administrator"

# >= 32 chars, стабильный — иначе JWT инвалидируются при рестарте.
$env:JWT_SECRET    = "local-dev-only-jwt-secret-min-32-chars-not-for-production-use"
$env:AUDIT_PEPPER  = "local-dev-only-audit-pepper-not-secret-rotate-in-prod"

# Индексатор: подключение к локальной Hardhat-ноде.
$env:BLOCKCHAIN_INDEXER_ENABLED = "true"
$env:BLOCKCHAIN_RPC_URL         = "http://127.0.0.1:8545"
# Адрес контракта тот же, что в frontend/.env.local — обновляется при пересдеплое.
$env:BLOCKCHAIN_CONTRACT_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"
$env:BLOCKCHAIN_INDEXER_START_BLOCK = "0"
$env:BLOCKCHAIN_INDEXER_DELAY_MS    = "5000"

Write-Host ""
Write-Host "Backend env установлен:"
Write-Host "  APP_ADMIN_WALLET = $env:APP_ADMIN_WALLET"
Write-Host "  BLOCKCHAIN_CONTRACT_ADDRESS = $env:BLOCKCHAIN_CONTRACT_ADDRESS"
Write-Host "  BLOCKCHAIN_INDEXER_ENABLED  = $env:BLOCKCHAIN_INDEXER_ENABLED"
Write-Host "  JWT_SECRET = (set, $($env:JWT_SECRET.Length) chars)"
Write-Host ""

mvn spring-boot:run
