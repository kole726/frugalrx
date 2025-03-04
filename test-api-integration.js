const fetch = require('node-fetch');

async function testApiIntegration() {
  try {
    console.log('Testing America\'s Pharmacy API Integration');
    
    // Step 1: Test authentication
    console.log('\n--- Step 1: Testing Authentication ---');
    const authResponse = await fetch('https://medimpact.okta.com/oauth2/aus107c5yrHDu55K8297/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': '0oatgei47wp1CfkaQ297',
        'client_secret': 'pMQW2VhwqCiCcG2sWtEEsTW5b3rbMkMHaI5oChXjJDa2f3e5jzkjzKIV-IgJmObc',
        'scope': 'ccds.read'
      }).toString()
    });
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error(`Authentication failed: ${authResponse.status} - ${errorText}`);
      return;
    }
    
    const authData = await authResponse.json();
    console.log('Authentication successful!');
    console.log(`Token type: ${authData.token_type}`);
    console.log(`Expires in: ${authData.expires_in} seconds`);
    console.log(`Access token length: ${authData.access_token.length} characters`);
    
    const token = authData.access_token;
    
    // Step 2: Test drug search
    console.log('\n--- Step 2: Testing Drug Search ---');
    const drugSearchResponse = await fetch('https://api.americaspharmacy.com/pricing/v1/drugs/names', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'hqMappingName': 'walkerrx',
        'prefixText': 'tylenol'
      })
    });
    
    if (!drugSearchResponse.ok) {
      const errorText = await drugSearchResponse.text();
      console.error(`Drug search failed: ${drugSearchResponse.status} - ${errorText}`);
    } else {
      const drugSearchData = await drugSearchResponse.json();
      console.log('Drug search successful!');
      console.log('Drug names:', drugSearchData.drugNames || drugSearchData);
    }
    
    // Step 3: Test drug prices
    console.log('\n--- Step 3: Testing Drug Prices ---');
    const drugPricesResponse = await fetch('https://api.americaspharmacy.com/pricing/v1/drugprices/byName', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'hqMappingName': 'walkerrx',
        'drugName': 'tylenol',
        'latitude': 30.4015,
        'longitude': -97.7527
      })
    });
    
    if (!drugPricesResponse.ok) {
      const errorText = await drugPricesResponse.text();
      console.error(`Drug prices failed: ${drugPricesResponse.status} - ${errorText}`);
    } else {
      const drugPricesData = await drugPricesResponse.json();
      console.log('Drug prices successful!');
      console.log(`Found ${drugPricesData.pharmacies?.length || 0} pharmacies with prices`);
      
      // Check for brand variations
      if (drugPricesData.drug) {
        console.log('Drug information:', drugPricesData.drug);
      }
      
      // Print the first few pharmacies
      if (drugPricesData.pharmacies && drugPricesData.pharmacies.length > 0) {
        console.log('First 3 pharmacies:');
        drugPricesData.pharmacies.slice(0, 3).forEach((pharmacy, index) => {
          console.log(`${index + 1}. ${pharmacy.pharmacy?.name || 'Unknown'} - $${pharmacy.price || 'N/A'} (${pharmacy.pharmacy?.distance || 'N/A'} miles)`);
        });
      }
    }
    
    // Step 4: Test pharmacy search
    console.log('\n--- Step 4: Testing Pharmacy Search ---');
    const pharmacySearchResponse = await fetch('https://api.americaspharmacy.com/pricing/v1/pharmacies?lat=30.4015&long=-97.7527&hqmappingName=walkerrx&pharmacyCount=5', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!pharmacySearchResponse.ok) {
      const errorText = await pharmacySearchResponse.text();
      console.error(`Pharmacy search failed: ${pharmacySearchResponse.status} - ${errorText}`);
    } else {
      const pharmacySearchData = await pharmacySearchResponse.json();
      console.log('Pharmacy search successful!');
      console.log(`Found ${pharmacySearchData.pharmacies?.length || 0} pharmacies`);
      
      // Print the pharmacies
      if (pharmacySearchData.pharmacies && pharmacySearchData.pharmacies.length > 0) {
        console.log('Pharmacies:');
        pharmacySearchData.pharmacies.forEach((pharmacy, index) => {
          console.log(`${index + 1}. ${pharmacy.name || 'Unknown'} (${pharmacy.distance || 'N/A'} miles)`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error in API integration test:', error);
  }
}

testApiIntegration(); 