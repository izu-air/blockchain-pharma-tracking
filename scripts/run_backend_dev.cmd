@echo off
REM ===========================================================================
REM run_backend_dev.cmd — то же, что run_backend_dev.ps1, но для cmd.exe.
REM Запускать из каталога backend:  ..\scripts\run_backend_dev.cmd
REM ===========================================================================

set APP_ADMIN_WALLET=0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
set APP_ADMIN_NAME=Local-dev administrator

set JWT_SECRET=local-dev-only-jwt-secret-min-32-chars-not-for-production-use
set AUDIT_PEPPER=local-dev-only-audit-pepper-not-secret-rotate-in-prod

set BLOCKCHAIN_INDEXER_ENABLED=true
set BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
set BLOCKCHAIN_CONTRACT_ADDRESS=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
set BLOCKCHAIN_INDEXER_START_BLOCK=0
set BLOCKCHAIN_INDEXER_DELAY_MS=5000

echo.
echo Backend env set:
echo   APP_ADMIN_WALLET = %APP_ADMIN_WALLET%
echo   BLOCKCHAIN_CONTRACT_ADDRESS = %BLOCKCHAIN_CONTRACT_ADDRESS%
echo   BLOCKCHAIN_INDEXER_ENABLED  = %BLOCKCHAIN_INDEXER_ENABLED%
echo   JWT_SECRET = (set)
echo.

mvn spring-boot:run
