-- First, insert a default company if it doesn't exist
INSERT INTO companies (name, address, city, country, phone, email, active, createdAt, updatedAt)
SELECT 'Default Company', '123 Main Street', 'Lusaka', 'Zambia', '+260 123 456789', 'info@defaultcompany.com', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name = 'Default Company');

-- Get the company ID (either the one we just inserted or an existing one)
SET @company_id = (SELECT id FROM companies WHERE name = 'Default Company' LIMIT 1);

-- Insert admin user with bcrypt hashed password
-- The password is 'password123' hashed with bcrypt
INSERT INTO users (companyId, firstName, lastName, email, password, role, active, createdAt, updatedAt)
SELECT @company_id, 'Admin', 'User', 'admin@example.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9MUZWg9hgTM0hBKqjRdGzUHf6j7P1Aq', 'admin', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');

-- Note: The password hash above is for 'password123'
-- If you want to use a different password, you'll need to generate a new hash
