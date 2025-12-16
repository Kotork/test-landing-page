-- Extend users table with admin management fields
ALTER TABLE users
  ADD COLUMN full_name TEXT,
  ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'disabled')),
  ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN locked_at TIMESTAMP,
  ADD COLUMN last_login_at TIMESTAMP,
  ADD COLUMN password_reset_required BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN created_by UUID REFERENCES users(id),
  ADD COLUMN updated_by UUID REFERENCES users(id),
  ADD COLUMN disabled_reason TEXT,
  ADD COLUMN onboarding_note TEXT,
  ADD COLUMN invited_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);

-- Audit log for administrative user actions
CREATE TABLE IF NOT EXISTS user_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  acted_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_audit_logs_user_id_created_at
  ON user_audit_logs(user_id, created_at DESC);

