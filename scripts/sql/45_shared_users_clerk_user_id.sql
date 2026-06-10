BEGIN;

ALTER TABLE shared.users
  ADD COLUMN IF NOT EXISTS clerk_user_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_clerk_user_id_key'
      AND conrelid = 'shared.users'::regclass
  ) THEN
    ALTER TABLE shared.users
      ADD CONSTRAINT users_clerk_user_id_key UNIQUE (clerk_user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS users_clerk_user_id_idx
  ON shared.users (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;

COMMIT;
