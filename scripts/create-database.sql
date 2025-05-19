-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS truckapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE truckapp;

-- Create tables (these will be managed by Sequelize, but this is for reference)
-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postalCode VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  logo VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'user') DEFAULT 'user',
  phone VARCHAR(20),
  profilePicture VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  lastLogin DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  licenseNumber VARCHAR(50) NOT NULL UNIQUE,
  licenseExpiry DATE NOT NULL,
  dateOfBirth DATE,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postalCode VARCHAR(20),
  emergencyContactName VARCHAR(200),
  emergencyContactPhone VARCHAR(20),
  status ENUM('active', 'inactive', 'on_leave') DEFAULT 'inactive',
  profilePicture VARCHAR(255),
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trucks table
CREATE TABLE IF NOT EXISTS trucks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  numberPlate VARCHAR(20) NOT NULL UNIQUE,
  make VARCHAR(50),
  model VARCHAR(50),
  year INT,
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'inactive',
  route VARCHAR(255),
  cargoType VARCHAR(100),
  lastUpdate DATETIME,
  roadTaxDate DATE,
  insuranceDate DATE,
  fitnessDate DATE,
  comesaExpiryDate DATE,
  nextMaintenance DATE,
  currentDriverId INT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (currentDriverId) REFERENCES drivers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
