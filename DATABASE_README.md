# Database Setup Instructions

This application uses MySQL as its database. Follow these instructions to set up the database for the Truck Fleet Tracker application.

## Prerequisites

- MySQL Server (5.7+ or 8.0+) installed and running
- MySQL client or MySQL Workbench for database management

## Setup Steps

### 1. Create the Database

You can create the database manually using the SQL script provided in `scripts/create-database.sql`:

```bash
# Connect to MySQL (replace 'root' with your MySQL username if different)
mysql -u root -p

# Once connected, run:
source scripts/create-database.sql
```

Alternatively, you can use MySQL Workbench or another MySQL client to run the SQL script.

### 2. Configure Environment Variables

Make sure your `.env` file in the server directory contains the correct database configuration:

```
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=truckapp
DB_USER=root
DB_PASSWORD=your_password
NODE_ENV=development
RESET_DB=true  # Set to true to reset the database on server start (development only)
```

Update the values to match your MySQL configuration.

### 3. Initialize the Database

The application will automatically create the tables and relationships when it starts. If `RESET_DB` is set to `true` and `NODE_ENV` is set to `development`, it will drop and recreate all tables and seed them with sample data.

To manually initialize the database without starting the server, you can create a script that calls the initialization function:

```javascript
// scripts/init-db.js
const { initializeDatabase } = require('../utils/initDb');

// Pass true to force recreate tables
initializeDatabase(true)
  .then(() => {
    console.log('Database initialized successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
```

Then run it with:

```bash
node scripts/init-db.js
```

## Database Schema

The application uses the following tables:

### Companies
- `id`: Primary key
- `name`: Company name
- `address`: Company address
- `city`: City
- `state`: State/Province
- `country`: Country
- `postalCode`: Postal code
- `phone`: Phone number
- `email`: Email address
- `website`: Website URL
- `logo`: Logo image path
- `active`: Whether the company is active
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Users
- `id`: Primary key
- `companyId`: Foreign key to companies
- `firstName`: First name
- `lastName`: Last name
- `email`: Email address (unique)
- `password`: Hashed password
- `role`: User role (admin, manager, user)
- `phone`: Phone number
- `profilePicture`: Profile picture path
- `active`: Whether the user is active
- `lastLogin`: Last login timestamp
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Trucks
- `id`: Primary key
- `companyId`: Foreign key to companies
- `name`: Truck name
- `numberPlate`: License plate (unique)
- `make`: Manufacturer
- `model`: Model
- `year`: Year of manufacture
- `status`: Status (active, inactive, maintenance)
- `route`: Current route
- `cargoType`: Type of cargo
- `lastUpdate`: Last update timestamp
- `roadTaxDate`: Road tax expiry date
- `insuranceDate`: Insurance expiry date
- `fitnessDate`: Fitness certificate expiry date
- `comesaExpiryDate`: COMESA expiry date
- `nextMaintenance`: Next maintenance date
- `currentDriverId`: Foreign key to drivers
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Drivers
- `id`: Primary key
- `companyId`: Foreign key to companies
- `firstName`: First name
- `lastName`: Last name
- `email`: Email address
- `phone`: Phone number
- `licenseNumber`: Driver's license number (unique)
- `licenseExpiry`: License expiry date
- `dateOfBirth`: Date of birth
- `address`: Address
- `city`: City
- `state`: State/Province
- `country`: Country
- `postalCode`: Postal code
- `emergencyContactName`: Emergency contact name
- `emergencyContactPhone`: Emergency contact phone
- `status`: Status (active, inactive, on_leave)
- `profilePicture`: Profile picture path
- `notes`: Additional notes
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
