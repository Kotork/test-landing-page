-- Add created_by foreign key to customers table
-- This resolves the circular dependency between customers and users

ALTER TABLE customers 
  ADD CONSTRAINT customers_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id);

