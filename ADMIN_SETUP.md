# Admin User Setup Instructions

This document provides instructions on how to create an admin user for the Truck Fleet Tracker application.

## Option 1: Using the Node.js Script (Recommended)

The easiest way to create an admin user is to use the provided Node.js script:

```bash
# Navigate to the server directory
cd server

# Run the admin creation script
npm run create-admin
```

This script will:
1. Connect to the database
2. Create a default company if it doesn't exist
3. Create an admin user with the following credentials:
   - Email: admin@example.com
   - Password: password123
   - Role: admin

If the admin user already exists, the script will not create a duplicate.

## Option 2: Using SQL Directly

If you prefer to use SQL directly, you can use the provided SQL script:

```bash
# Connect to your MySQL database
mysql -u your_username -p your_database_name

# Once connected, run the SQL script
source scripts/insert-admin.sql
```

Or you can copy and paste the following SQL commands directly:

```sql
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
```

## Option 3: Creating a Custom Admin User

If you want to create an admin user with different credentials, you can modify the `create-admin.js` script:

1. Open `server/scripts/create-admin.js`
2. Modify the `adminDetails` object with your preferred details:
   ```javascript
   const adminDetails = {
     firstName: 'Your Name',
     lastName: 'Your Last Name',
     email: 'your.email@example.com',
     password: 'your_password',
     role: 'admin'
   };
   ```
3. Save the file and run `npm run create-admin`

## Login Credentials

After creating the admin user, you can log in to the application with:

- **Email**: admin@example.com (or your custom email)
- **Password**: password123 (or your custom password)

## Troubleshooting

If you encounter any issues:

1. Make sure your database connection is properly configured in the `.env` file
2. Check that the database and tables exist
3. Ensure that the bcrypt package is installed (`npm install bcrypt`)
4. Check the console for any error messages

If you need to reset your admin password, you can run the script again with a modified password, or use SQL to update the password directly (make sure to hash it with bcrypt first).
