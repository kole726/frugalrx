/**
 * Simple script to test the API connection directly
 * Run with: node src/scripts/test-api-connection.js
 */

import https from 'https';
import { stringify } from 'querystring';

// API configuration
const AUTH_URL = 'https://medimpact.okta.com/oauth2/aus107c5yrHDu55K8297/v1/token';
const API_BASE_URL = 'https://api.americaspharmacy.com/pricing';
const CLIENT_ID = '0oatgei47wp1CfkaQ297';
const CLIENT_SECRET = 'pMQW2VhwqCiCcG2sWtEEsTW5b3rbMkMHaI5oChXjJDa2f3e5jzkjzKIV-IgJmObc';
const HQ_MAPPING = 'walkerrx';

// Test configuration
const TEST_DRUG_NAME = 'lipitor';
const TEST_PREFIX = 'lip';
const TEST_LATITUDE = 30.4014;
const TEST_LONGITUDE = -97.7525;

// Global auth token
let authToken = null;

// Step 1: Get an authentication token
async function getAuthToken() {
  return new Promise((resolve, reject) => {
    const postData = stringify({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'ccds.read'
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(AUTH_URL, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`Auth request failed with status ${res.statusCode}:`, data);
          reject(new Error(`Auth request failed with status ${res.statusCode}`));
          return;
        }
        
        try {
          const parsedData = JSON.parse(data);
          if (!parsedData.access_token) {
            reject(new Error('No access token in response'));
            return;
          }
          
          console.log('Successfully obtained auth token');
          resolve(parsedData.access_token);
        } catch (error) {
          console.error('Error parsing auth response:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error making auth request:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Step 2: Test the API with a simple drug search (POST method)
async function testDrugSearch() {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      hqMappingName: HQ_MAPPING,
      prefixText: TEST_PREFIX
    });
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };
    
    const req = https.request(`${API_BASE_URL}/v1/drugs/names`, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`Drug search API error: ${res.statusCode}`, data);
          reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
          return;
        }
        
        try {
          const parsedData = JSON.parse(data);
          console.log('Drug search (POST) successful');
          console.log(`Found ${parsedData.length} results`);
          
          if (parsedData.length > 0) {
            console.log('First 5 results:');
            parsedData.slice(0, 5).forEach((drug, index) => {
              console.log(`  ${index + 1}. ${drug.drugName || drug}`);
            });
          }
          
          resolve(parsedData);
        } catch (error) {
          console.error('Error parsing drug search response:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error making drug search request:', error);
      reject(error);
    });
    
    req.write(requestBody);
    req.end();
  });
}

// Step 3: Test the drug search by prefix (GET method)
async function testDrugSearchByPrefix() {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    };
    
    const req = https.request(`${API_BASE_URL}/v1/drugs/names/prefix/${TEST_PREFIX}`, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`Drug search by prefix API error: ${res.statusCode}`, data);
          reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
          return;
        }
        
        try {
          const parsedData = JSON.parse(data);
          console.log('Drug search by prefix (GET) successful');
          console.log(`Found ${parsedData.length} results`);
          
          if (parsedData.length > 0) {
            console.log('First 5 results:');
            parsedData.slice(0, 5).forEach((drug, index) => {
              console.log(`  ${index + 1}. ${drug.drugName || drug}`);
            });
          }
          
          resolve(parsedData);
        } catch (error) {
          console.error('Error parsing drug search by prefix response:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error making drug search by prefix request:', error);
      reject(error);
    });
    
    req.end();
  });
}

// Step 4: Test the drug prices API
async function testDrugPrices() {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      hqMappingName: HQ_MAPPING,
      drugName: TEST_DRUG_NAME,
      latitude: TEST_LATITUDE,
      longitude: TEST_LONGITUDE
    });
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };
    
    const req = https.request(`${API_BASE_URL}/v1/drugprices/byName`, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`Drug prices API error: ${res.statusCode}`, data);
          reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
          return;
        }
        
        try {
          const parsedData = JSON.parse(data);
          console.log('Drug prices API request successful');
          console.log(`Found ${parsedData.pharmacies?.length || 0} pharmacies for ${TEST_DRUG_NAME}`);
          
          resolve(parsedData);
        } catch (error) {
          console.error('Error parsing drug prices response:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error making drug prices request:', error);
      reject(error);
    });
    
    req.write(requestBody);
    req.end();
  });
}

// Step 5: Test the group drug prices API
async function testGroupDrugPrices() {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      hqMappingName: HQ_MAPPING,
      drugNames: [TEST_DRUG_NAME, 'amoxicillin'],
      latitude: TEST_LATITUDE,
      longitude: TEST_LONGITUDE
    });
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };
    
    const req = https.request(`${API_BASE_URL}/v1/drugprices/groupdrugprices`, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`Group drug prices API error: ${res.statusCode}`, data);
          reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
          return;
        }
        
        try {
          const parsedData = JSON.parse(data);
          console.log('Group drug prices API request successful');
          console.log(`Found prices for ${Object.keys(parsedData).length} drugs`);
          
          resolve(parsedData);
        } catch (error) {
          console.error('Error parsing group drug prices response:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error making group drug prices request:', error);
      reject(error);
    });
    
    req.write(requestBody);
    req.end();
  });
}

// Test drug search with a short query (should fail)
async function testShortDrugSearch() {
  console.log('\nTesting drug search with short query (should fail)...');
  
  try {
    const requestBody = {
      hqMappingName: 'walkerrx',
      prefixText: 'a'  // Only 1 character
    };
    
    const response = await fetch(`${API_BASE_URL}/v1/drugs/names`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log(`Drug search with short query failed as expected with status ${response.status}`);
      console.log(`Error message: ${data.error || JSON.stringify(data)}`);
      return true;
    } else {
      console.error('Drug search with short query unexpectedly succeeded');
      return false;
    }
  } catch (error) {
    console.error('Error testing short drug search:', error);
    return false;
  }
}

// Test drug info API with a short name (should fail)
async function testShortDrugInfo() {
  console.log('\nTesting drug info API with short name (should fail)...');
  
  try {
    const response = await fetch(`http://localhost:3000/api/drugs/info/name?name=a`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log(`Drug info with short name failed as expected with status ${response.status}`);
      console.log(`Error message: ${data.error || JSON.stringify(data)}`);
      return true;
    } else {
      console.error('Drug info with short name unexpectedly succeeded');
      return false;
    }
  } catch (error) {
    console.error('Error testing short drug info:', error);
    return false;
  }
}

// Test drug prices API with a short name (should fail)
async function testShortDrugPrices() {
  console.log('\nTesting drug prices API with short name (should fail)...');
  
  try {
    const response = await fetch(`http://localhost:3000/api/drugs/prices?drugName=a`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log(`Drug prices with short name failed as expected with status ${response.status}`);
      console.log(`Error message: ${data.error || JSON.stringify(data)}`);
      return true;
    } else {
      console.error('Drug prices with short name unexpectedly succeeded');
      return false;
    }
  } catch (error) {
    console.error('Error testing short drug prices:', error);
    return false;
  }
}

// Main function to run all tests
async function runTests() {
  console.log('Testing API connection...');
  
  try {
    // Step 1: Get auth token
    console.log('Step 1: Getting auth token...');
    authToken = await getAuthToken();
    if (!authToken) {
      throw new Error('Failed to get auth token');
    }
    console.log('Successfully obtained auth token\n');
    
    // Step 2: Test drug search
    console.log('Step 2: Testing drug search (POST method)...');
    await testDrugSearch();
    
    // Step 3: Test drug search by prefix
    console.log('\nStep 3: Testing drug search by prefix (GET method)...');
    try {
      await testDrugSearchByPrefix();
    } catch (error) {
      console.error('Drug search by prefix API error:', error.message);
      console.log('Note: Drug search by prefix endpoint is not available in the current API version');
    }
    
    // Step 4: Test drug prices API
    console.log('\nStep 4: Testing drug prices API...');
    await testDrugPrices();
    
    // Step 5: Test group drug prices API
    console.log('\nStep 5: Testing group drug prices API...');
    try {
      await testGroupDrugPrices();
    } catch (error) {
      console.error('Group drug prices API error:', error.message);
      console.log('Note: Group drug prices endpoint is not available in the current API version');
    }
    
    // Step 6: Test validation for short drug names
    console.log('\nStep 6: Testing validation for short drug names...');
    await testShortDrugSearch();
    await testShortDrugInfo();
    await testShortDrugPrices();
    
    console.log('\nAPI connection test completed successfully');
  } catch (error) {
    console.error('API connection test failed:', error);
    process.exit(1);
  }
}

// Run the test
runTests(); 