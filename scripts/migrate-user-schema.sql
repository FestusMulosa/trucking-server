-- Migration script to update user schema for two-tier admin system
-- Run this script to update existing database schema

-- First, modify the role enum to include new roles
ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'company_admin', 'admin', 'manager', 'user') DEFAULT 'user';

-- Allow companyId to be NULL for super admins
ALTER TABLE users MODIFY COLUMN companyId INT NULL;

-- Update existing admin users to company_admin (preserving existing functionality)
UPDATE users SET role = 'company_admin' WHERE role = 'admin';

-- Optional: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(companyId, role);

-- Display current user roles after migration
SELECT 
    role,
    COUNT(*) as user_count,
    GROUP_CONCAT(DISTINCT CASE WHEN companyId IS NULL THEN 'NULL' ELSE CAST(companyId AS CHAR) END) as company_ids
FROM users 
GROUP BY role 
ORDER BY 
    CASE role 
        WHEN 'super_admin' THEN 1 
        WHEN 'company_admin' THEN 2 
        WHEN 'admin' THEN 3 
        WHEN 'manager' THEN 4 
        WHEN 'user' THEN 5 
    END;
