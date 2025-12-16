-- Add foreign key constraints between users and organizations tables
-- This migration must run after both users and organizations tables are created

-- Add foreign key constraint to users.organization_id
-- Links organization users to their organization
ALTER TABLE users
  ADD CONSTRAINT users_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- Add foreign key constraint to organizations.created_by
-- Links organizations to the staff user who created them
ALTER TABLE organizations
  ADD CONSTRAINT organizations_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id);

