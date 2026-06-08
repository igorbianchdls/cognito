DROP SCHEMA IF EXISTS composio CASCADE;

ALTER TABLE shared.users
  DROP COLUMN IF EXISTS composio_user_id,
  DROP COLUMN IF EXISTS composio_connected_at;
