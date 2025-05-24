-- Performance optimization indexes for truck application
-- Run this script to add indexes that will significantly improve query performance

USE trucking_breathatom;

-- Add indexes for companies table
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(active);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- Add indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(companyId);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(companyId, role);
CREATE INDEX IF NOT EXISTS idx_users_company_active ON users(companyId, active);

-- Add indexes for drivers table
CREATE INDEX IF NOT EXISTS idx_drivers_company_id ON drivers(companyId);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_license_number ON drivers(licenseNumber);
CREATE INDEX IF NOT EXISTS idx_drivers_company_status ON drivers(companyId, status);
CREATE INDEX IF NOT EXISTS idx_drivers_license_expiry ON drivers(licenseExpiry);
CREATE INDEX IF NOT EXISTS idx_drivers_email ON drivers(email);

-- Add indexes for trucks table
CREATE INDEX IF NOT EXISTS idx_trucks_company_id ON trucks(companyId);
CREATE INDEX IF NOT EXISTS idx_trucks_status ON trucks(status);
CREATE INDEX IF NOT EXISTS idx_trucks_number_plate ON trucks(numberPlate);
CREATE INDEX IF NOT EXISTS idx_trucks_current_driver_id ON trucks(currentDriverId);
CREATE INDEX IF NOT EXISTS idx_trucks_company_status ON trucks(companyId, status);
CREATE INDEX IF NOT EXISTS idx_trucks_next_maintenance ON trucks(nextMaintenance);
CREATE INDEX IF NOT EXISTS idx_trucks_road_tax_date ON trucks(roadTaxDate);
CREATE INDEX IF NOT EXISTS idx_trucks_insurance_date ON trucks(insuranceDate);
CREATE INDEX IF NOT EXISTS idx_trucks_fitness_date ON trucks(fitnessDate);
CREATE INDEX IF NOT EXISTS idx_trucks_comesa_expiry_date ON trucks(comesaExpiryDate);

-- Add indexes for maintenance table (if it exists)
CREATE INDEX IF NOT EXISTS idx_maintenance_company_id ON maintenance(companyId);
CREATE INDEX IF NOT EXISTS idx_maintenance_truck_id ON maintenance(truckId);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_start_date ON maintenance(startDate);
CREATE INDEX IF NOT EXISTS idx_maintenance_end_date ON maintenance(endDate);
CREATE INDEX IF NOT EXISTS idx_maintenance_company_status ON maintenance(companyId, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_truck_status ON maintenance(truckId, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_date_range ON maintenance(startDate, endDate);

-- Add indexes for platform_settings table (if it exists)
CREATE INDEX IF NOT EXISTS idx_platform_settings_company_id ON platform_settings(companyId);
CREATE INDEX IF NOT EXISTS idx_platform_settings_setting_key ON platform_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_platform_settings_company_key ON platform_settings(companyId, setting_key);

-- Show index creation results
SHOW INDEX FROM companies;
SHOW INDEX FROM users;
SHOW INDEX FROM drivers;
SHOW INDEX FROM trucks;
