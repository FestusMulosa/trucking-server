/**
 * Test script for truck endpoints
 * 
 * This script tests the CRUD operations for trucks:
 * - Create a new truck
 * - Get all trucks
 * - Get a single truck by ID
 * - Update a truck
 * - Delete a truck
 */

const fetch = require('node-fetch');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// API base URL
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
console.log('Using API URL:', API_BASE_URL);

// Store auth token and created truck ID
let authToken = null;
let createdTruckId = null;

// Test data for creating a truck
const testTruck = {
  companyId: 1,
  name: 'Test Truck',
  numberPlate: 'TEST 123 ZM',
  make: 'Test Make',
  model: 'Test Model',
  year: 2023,
  status: 'inactive',
  route: 'Test Route',
  cargoType: 'Test Cargo',
  roadTaxDate: '2023-12-31',
  insuranceDate: '2023-12-31',
  fitnessDate: '2023-12-31',
  comesaExpiryDate: '2023-12-31',
  nextMaintenance: '2023-12-31'
};

// Login to get auth token
const login = async () => {
  try {
    console.log('Logging in...');
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: process.env.TEST_USER_EMAIL || 'admin@example.com',
        password: process.env.TEST_USER_PASSWORD || 'password123'
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Login failed:', data.error || data.message || 'Unknown error');
      return false;
    }
    
    authToken = data.token;
    console.log('Login successful, token received');
    return true;
  } catch (error) {
    console.error('Login error:', error.message);
    return false;
  }
};

// Test creating a truck
const testCreateTruck = async () => {
  try {
    console.log('\n--- Testing Create Truck ---');
    console.log('Creating truck with data:', testTruck);
    
    const response = await fetch(`${API_BASE_URL}/trucks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testTruck)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Create truck failed:', data.error || data.message || 'Unknown error');
      return false;
    }
    
    createdTruckId = data.id;
    console.log('Truck created successfully with ID:', createdTruckId);
    console.log('Created truck data:', data);
    return true;
  } catch (error) {
    console.error('Create truck error:', error.message);
    return false;
  }
};

// Test getting all trucks
const testGetAllTrucks = async () => {
  try {
    console.log('\n--- Testing Get All Trucks ---');
    
    const response = await fetch(`${API_BASE_URL}/trucks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Get all trucks failed:', data.error || data.message || 'Unknown error');
      return false;
    }
    
    console.log(`Retrieved ${data.length} trucks`);
    return true;
  } catch (error) {
    console.error('Get all trucks error:', error.message);
    return false;
  }
};

// Test getting a single truck
const testGetTruck = async () => {
  try {
    console.log('\n--- Testing Get Truck ---');
    
    if (!createdTruckId) {
      console.error('No truck ID available for testing');
      return false;
    }
    
    const response = await fetch(`${API_BASE_URL}/trucks/${createdTruckId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Get truck failed:', data.error || data.message || 'Unknown error');
      return false;
    }
    
    console.log('Retrieved truck data:', data);
    return true;
  } catch (error) {
    console.error('Get truck error:', error.message);
    return false;
  }
};

// Test updating a truck
const testUpdateTruck = async () => {
  try {
    console.log('\n--- Testing Update Truck ---');
    
    if (!createdTruckId) {
      console.error('No truck ID available for testing');
      return false;
    }
    
    const updateData = {
      ...testTruck,
      name: 'Updated Test Truck',
      status: 'active'
    };
    
    console.log('Updating truck with data:', updateData);
    
    const response = await fetch(`${API_BASE_URL}/trucks/${createdTruckId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Update truck failed:', data.error || data.message || 'Unknown error');
      return false;
    }
    
    console.log('Truck updated successfully');
    console.log('Updated truck data:', data);
    return true;
  } catch (error) {
    console.error('Update truck error:', error.message);
    return false;
  }
};

// Test deleting a truck
const testDeleteTruck = async () => {
  try {
    console.log('\n--- Testing Delete Truck ---');
    
    if (!createdTruckId) {
      console.error('No truck ID available for testing');
      return false;
    }
    
    const response = await fetch(`${API_BASE_URL}/trucks/${createdTruckId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Delete truck failed:', data.error || data.message || 'Unknown error');
      return false;
    }
    
    console.log('Truck deleted successfully');
    return true;
  } catch (error) {
    console.error('Delete truck error:', error.message);
    return false;
  }
};

// Run all tests
const runTests = async () => {
  console.log('Starting truck endpoint tests...');
  
  // Login first
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('Login failed, cannot proceed with tests');
    return;
  }
  
  // Run CRUD tests
  const createSuccess = await testCreateTruck();
  await testGetAllTrucks();
  
  if (createSuccess) {
    await testGetTruck();
    await testUpdateTruck();
    await testDeleteTruck();
  }
  
  console.log('\nTruck endpoint tests completed');
};

// Run the tests
runTests();
