/**
 * Test script for API endpoints
 * 
 * This script tests the API endpoints directly using the Americas Pharmacy API
 * to verify that the credentials and endpoints are working correctly.
 * 
 * Usage:
 * node -r dotenv/config src/scripts/test-api-endpoints.js
 */

const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

// Get environment variables
const API_URL = process.env.AMERICAS_PHARMACY_API_URL || 'https://api.americaspharmacy.com';
const AUTH_URL = process.env.AMERICAS_PHARMACY_AUTH_URL || 'https://medimpact.okta.com/oauth2/aus107c5yrHDu55K8297/v1/token';
const CLIENT_ID = process.env.AMERICAS_PHARMACY_CLIENT_ID;
const CLIENT_SECRET = process.env.AMERICAS_PHARMACY_CLIENT_SECRET;
const HQ_MAPPING = process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx';

// Test drug GSNs
const TEST_GSNS = [1790, 1717, 19323];

/**
 * Get authentication token
 */
async function getAuthToken() {
  try {
    console.log(`\nRequesting auth token from: ${AUTH_URL}`);
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('Missing CLIENT_ID or CLIENT_SECRET environment variables');
      throw new Error('Missing API credentials');
    }
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('scope', 'ccds.read');
    
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Authentication failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.access_token) {
      console.error('Invalid token response:', data);
      throw new Error('Invalid authentication response from API');
    }
    
    console.log('✅ Successfully obtained auth token');
    return data.access_token;
  } catch (error) {
    console.error('❌ Error getting authentication token:', error);
    throw error;
  }
}

/**
 * Test drug info endpoint
 */
async function testDrugInfoEndpoint(token, gsn) {
  try {
    console.log(`\nTesting drug info endpoint for GSN: ${gsn}`);
    
    // Create URL
    const url = `${API_URL}/pricing/v1/druginfo/${gsn}`;
    console.log(`Making request to: ${url}`);
    
    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Drug info API error: ${response.status}`, errorText);
      return {
        success: false,
        status: response.status,
        error: errorText
      };
    }
    
    const data = await response.json();
    console.log(`✅ Successfully retrieved drug info for GSN ${gsn}`);
    
    return {
      success: true,
      status: response.status,
      data: data
    };
  } catch (error) {
    console.error(`❌ Error testing drug info endpoint for GSN ${gsn}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test drug search endpoint
 */
async function testDrugSearchEndpoint(token, query) {
  try {
    console.log(`\nTesting drug search endpoint for query: "${query}"`);
    
    // Create URL
    const url = `${API_URL}/drugs/names`;
    console.log(`Making request to: ${url}`);
    
    // Make API request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hqMappingName: HQ_MAPPING,
        prefixText: query.toLowerCase()
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Drug search API error: ${response.status}`, errorText);
      return {
        success: false,
        status: response.status,
        error: errorText
      };
    }
    
    const data = await response.json();
    console.log(`✅ Successfully searched for "${query}" and found ${Array.isArray(data) ? data.length : 0} results`);
    
    return {
      success: true,
      status: response.status,
      data: data
    };
  } catch (error) {
    console.error(`❌ Error testing drug search endpoint for query "${query}":`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test pharmacy prices endpoint
 */
async function testPharmacyPricesEndpoint(token, gsn) {
  try {
    console.log(`\nTesting pharmacy prices endpoint for GSN: ${gsn}`);
    
    // Create URL
    const url = `${API_URL}/pricing/v1/pharmacyprices`;
    console.log(`Making request to: ${url}`);
    
    // Test location (Austin, TX)
    const location = {
      latitude: 30.2672,
      longitude: -97.7431,
      radius: 10
    };
    
    // Make API request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hqMappingName: HQ_MAPPING,
        gsn: gsn,
        latitude: location.latitude,
        longitude: location.longitude,
        radius: location.radius
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pharmacy prices API error: ${response.status}`, errorText);
      return {
        success: false,
        status: response.status,
        error: errorText
      };
    }
    
    const data = await response.json();
    console.log(`✅ Successfully retrieved pharmacy prices for GSN ${gsn}`);
    
    return {
      success: true,
      status: response.status,
      data: data
    };
  } catch (error) {
    console.error(`❌ Error testing pharmacy prices endpoint for GSN ${gsn}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting API endpoint tests...');
  console.log('API URL:', API_URL);
  console.log('AUTH URL:', AUTH_URL);
  
  try {
    // Get authentication token
    const token = await getAuthToken();
    
    // Test drug info endpoint
    for (const gsn of TEST_GSNS) {
      const drugInfoResult = await testDrugInfoEndpoint(token, gsn);
      console.log(`Drug info test for GSN ${gsn}: ${drugInfoResult.success ? 'SUCCESS' : 'FAILED'}`);
    }
    
    // Test drug search endpoint
    const searchQueries = ['tylenol', 'advil', 'lipitor'];
    for (const query of searchQueries) {
      const searchResult = await testDrugSearchEndpoint(token, query);
      console.log(`Drug search test for "${query}": ${searchResult.success ? 'SUCCESS' : 'FAILED'}`);
    }
    
    // Test pharmacy prices endpoint
    for (const gsn of TEST_GSNS) {
      const pricesResult = await testPharmacyPricesEndpoint(token, gsn);
      console.log(`Pharmacy prices test for GSN ${gsn}: ${pricesResult.success ? 'SUCCESS' : 'FAILED'}`);
    }
    
    console.log('\n=== Test Summary ===');
    console.log('All tests completed. Check the logs above for details on any failures.');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests(); 