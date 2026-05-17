-- =============================================================================
-- V4 — extend allowed user roles with ADMIN.
--
-- V2 introduced CHECK constraints that limit `app_users.role` and
-- `organizations.role` to the original five values.  Adding ADMIN to the
-- enum requires updating those constraints, otherwise inserts/updates of
-- ADMIN rows would fail with constraint violation.
-- =============================================================================

ALTER TABLE app_users
    DROP CONSTRAINT IF EXISTS chk_app_users_role;

ALTER TABLE app_users
    ADD CONSTRAINT chk_app_users_role
    CHECK (role IN ('ADMIN','MANUFACTURER','DISTRIBUTOR','PHARMACY','REGULATOR','CONSUMER'));

ALTER TABLE organizations
    DROP CONSTRAINT IF EXISTS chk_org_role;

ALTER TABLE organizations
    ADD CONSTRAINT chk_org_role
    CHECK (role IN ('ADMIN','MANUFACTURER','DISTRIBUTOR','PHARMACY','REGULATOR'));
