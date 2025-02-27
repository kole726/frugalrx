/**
 * Test script to diagnose issues with drug API communication
 * 
 * This script tests the API with various drug names to identify which ones are failing
 * and provides detailed error information.
 * 
 * Run with: node --experimental-json-modules -r dotenv/config src/scripts/test-drug-api.js
 */

// Import required modules
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

// Test drug names - a mix of common medications
const TEST_DRUGS = [
  'amoxicillin',
  'lisinopril',
  'atorvastatin',
  'metformin',
  'simvastatin',
  'omeprazole',
  'losartan',
  'albuterol',
  'gabapentin',
  'hydrochlorothiazide',
  'metoprolol',
  'amlodipine',
  'levothyroxine',
  'prednisone',
  'ibuprofen',
  'acetaminophen',
  'aspirin',
  'fluoxetine',
  'sertraline',
  'citalopram'
];

// Authentication function
async function getAuthToken() {
  try {
    const authUrl = process.env.AMERICAS_PHARMACY_AUTH_URL;
    const clientId = process.env.AMERICAS_PHARMACY_CLIENT_ID;
    const clientSecret = process.env.AMERICAS_PHARMACY_CLIENT_SECRET;
    
    if (!authUrl || !clientId || !clientSecret) {
      console.error('Missing required environment variables for authentication');
      throw new Error('Missing API credentials in environment variables');
    }
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'ccds.read');

    console.log(`Requesting auth token from: ${authUrl}`);
    
    const response = await fetch(authUrl, {
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
    
    console.log('Successfully obtained auth token');
    return data.access_token;
  } catch (error) {
    console.error('Error getting authentication token:', error);
    throw new Error('Failed to authenticate with the medication API');
  }
}

// Search drugs function
async function searchDrugs(query, token) {
  try {
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Convert query to lowercase to ensure consistent API requests
    const normalizedQuery = query.toLowerCase();
    console.log(`\nSearching for drugs with query: "${normalizedQuery}" at ${apiUrl}/drugs/names`);
    
    // Make API request
    const response = await fetch(`${apiUrl}/drugs/names`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hqMappingName: 'walkerrx',
        prefixText: normalizedQuery
      })
    });

    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Drug search API error: ${response.status}`, errorText);
      console.error(`Request details: query="${normalizedQuery}", endpoint=${apiUrl}/drugs/names`);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Found ${Array.isArray(data) ? data.length : 0} drug matches for "${normalizedQuery}"`);
    
    // Return the data
    return data;
  } catch (error) {
    console.error('Error searching drugs:', error);
    return { error: error.message };
  }
}

// Main test function
async function testDrugAPI() {
  console.log('Starting drug API test...');
  
  try {
    // Get authentication token
    const token = await getAuthToken();
    
    // Test results
    const results = {
      successful: [],
      failed: []
    };
    
    // Test each drug
    for (const drug of TEST_DRUGS) {
      try {
        const result = await searchDrugs(drug, token);
        
        if (result.error) {
          results.failed.push({ drug, error: result.error });
        } else {
          results.successful.push({ drug, count: Array.isArray(result) ? result.length : 0 });
        }
      } catch (error) {
        results.failed.push({ drug, error: error.message });
      }
    }
    
    // Print summary
    console.log('\n\n=== TEST RESULTS SUMMARY ===');
    console.log(`Total drugs tested: ${TEST_DRUGS.length}`);
    console.log(`Successful: ${results.successful.length}`);
    console.log(`Failed: ${results.failed.length}`);
    
    console.log('\n=== SUCCESSFUL DRUGS ===');
    results.successful.forEach(item => {
      console.log(`- ${item.drug}: Found ${item.count} results`);
    });
    
    console.log('\n=== FAILED DRUGS ===');
    results.failed.forEach(item => {
      console.log(`- ${item.drug}: ${item.error}`);
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testDrugAPI(); 