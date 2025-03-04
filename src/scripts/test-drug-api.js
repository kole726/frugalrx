/**
 * Test script for the drug info API
 * 
 * This script tests the drug info API endpoints to verify they are working correctly.
 * It makes requests to both the drug info and drug prices endpoints.
 * 
 * Usage:
 * node src/scripts/test-drug-api.js
 */

// Use fetch in Node.js
const fetch = require('node-fetch');

// Base URL for API requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

// Test drug names and GSNs
const TEST_DRUGS = [
  { name: 'tylenol', gsn: 1790 },
  { name: 'advil', gsn: 1717 },
  { name: 'lipitor', gsn: 19323 },
  { name: 'ibuprofen', gsn: 1717 }
];

// Test location (Austin, TX)
const TEST_LOCATION = {
  latitude: 30.2672,
  longitude: -97.7431,
  radius: 10
};

/**
 * Test the drug info API
 */
async function testDrugInfoAPI() {
  console.log('\n=== Testing Drug Info API ===\n');
  
  for (const drug of TEST_DRUGS) {
    console.log(`\nTesting drug info for: ${drug.name} (GSN: ${drug.gsn})`);
    
    // Test drug info by name
    try {
      console.log(`\n1. Testing /api/drugs/info/name?name=${drug.name}`);
      const nameResponse = await fetch(`${API_BASE_URL}/drugs/info/name?name=${drug.name}`);
      
      console.log(`Status: ${nameResponse.status} ${nameResponse.statusText}`);
      
      if (nameResponse.ok) {
        const data = await nameResponse.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
        
        if (data.usingMockData) {
          console.log('⚠️ WARNING: Using mock data');
        } else {
          console.log('✅ SUCCESS: Received real data');
        }
      } else {
        console.log('❌ ERROR: Failed to get drug info by name');
        try {
          const errorText = await nameResponse.text();
          console.log('Error details:', errorText);
        } catch (e) {
          console.log('Could not parse error response');
        }
      }
    } catch (error) {
      console.log('❌ ERROR: Exception when fetching drug info by name:', error.message);
    }
    
    // Test drug info by GSN
    try {
      console.log(`\n2. Testing /api/drugs/info/gsn?gsn=${drug.gsn}`);
      const gsnResponse = await fetch(`${API_BASE_URL}/drugs/info/gsn?gsn=${drug.gsn}`);
      
      console.log(`Status: ${gsnResponse.status} ${gsnResponse.statusText}`);
      
      if (gsnResponse.ok) {
        const data = await gsnResponse.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
        
        if (data.usingMockData) {
          console.log('⚠️ WARNING: Using mock data');
        } else {
          console.log('✅ SUCCESS: Received real data');
        }
      } else {
        console.log('❌ ERROR: Failed to get drug info by GSN');
        try {
          const errorText = await gsnResponse.text();
          console.log('Error details:', errorText);
        } catch (e) {
          console.log('Could not parse error response');
        }
      }
    } catch (error) {
      console.log('❌ ERROR: Exception when fetching drug info by GSN:', error.message);
    }
  }
}

/**
 * Test the drug prices API
 */
async function testDrugPricesAPI() {
  console.log('\n=== Testing Drug Prices API ===\n');
  
  for (const drug of TEST_DRUGS) {
    console.log(`\nTesting drug prices for: ${drug.name} (GSN: ${drug.gsn})`);
    
    // Test drug prices
    try {
      console.log(`\nTesting /api/drugs/prices`);
      
      const requestBody = {
        drugName: drug.name,
        gsn: drug.gsn,
        latitude: TEST_LOCATION.latitude,
        longitude: TEST_LOCATION.longitude,
        radius: TEST_LOCATION.radius
      };
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const pricesResponse = await fetch(`${API_BASE_URL}/drugs/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log(`Status: ${pricesResponse.status} ${pricesResponse.statusText}`);
      
      if (pricesResponse.ok) {
        const data = await pricesResponse.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
        
        if (data.usingMockData) {
          console.log('⚠️ WARNING: Using mock data');
        } else {
          console.log('✅ SUCCESS: Received real data');
        }
        
        // Check if we have pharmacy prices
        if (data.pharmacies && data.pharmacies.length > 0) {
          console.log(`Found ${data.pharmacies.length} pharmacies with prices`);
        } else {
          console.log('❌ WARNING: No pharmacy prices found');
        }
      } else {
        console.log('❌ ERROR: Failed to get drug prices');
        try {
          const errorText = await pricesResponse.text();
          console.log('Error details:', errorText);
        } catch (e) {
          console.log('Could not parse error response');
        }
      }
    } catch (error) {
      console.log('❌ ERROR: Exception when fetching drug prices:', error.message);
    }
  }
}

/**
 * Main function to run all tests
 */
async function runTests() {
  console.log('Starting API tests...');
  
  try {
    await testDrugInfoAPI();
    await testDrugPricesAPI();
    
    console.log('\n=== Test Summary ===\n');
    console.log('All tests completed. Check the logs above for details on any failures.');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests(); 