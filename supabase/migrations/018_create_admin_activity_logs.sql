-- General admin activity logs for auditing non-user resources
CREATE TABLE admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  acted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_activity_logs_resource
  ON admin_activity_logs (resource_type, resource_id);

CREATE INDEX idx_admin_activity_logs_created_at
  ON admin_activity_logs (created_at DESC);


