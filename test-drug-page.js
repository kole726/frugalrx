const fetch = require('node-fetch');

async function testDrugPage() {
  try {
    console.log('Testing Drug Page API Endpoints');
    
    // Test parameters
    const drugName = 'tylenol';
    const latitude = 30.4015;
    const longitude = -97.7527;
    const deploymentUrl = 'https://frugalrx-git-ea8ca71-revert-kole726s-projects.vercel.app';
    
    // Step 1: Test drug info API
    console.log('\n--- Step 1: Testing Drug Info API ---');
    const drugInfoUrl = `${deploymentUrl}/api/drugs/info/name?name=${encodeURIComponent(drugName)}`;
    console.log(`Fetching drug info from: ${drugInfoUrl}`);
    
    const drugInfoResponse = await fetch(drugInfoUrl);
    
    console.log(`Drug info API status: ${drugInfoResponse.status}`);
    
    if (!drugInfoResponse.ok) {
      const errorText = await drugInfoResponse.text();
      console.error(`Drug info API error: ${drugInfoResponse.status} - ${errorText}`);
    } else {
      const drugInfoData = await drugInfoResponse.json();
      console.log('Drug info API response:', JSON.stringify(drugInfoData, null, 2));
    }
    
    // Step 2: Test drug prices API
    console.log('\n--- Step 2: Testing Drug Prices API ---');
    const drugPricesUrl = `${deploymentUrl}/api/drugs/prices`;
    console.log(`Fetching drug prices from: ${drugPricesUrl}`);
    
    const drugPricesResponse = await fetch(drugPricesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        drugName,
        latitude,
        longitude,
        radius: 10
      })
    });
    
    console.log(`Drug prices API status: ${drugPricesResponse.status}`);
    
    if (!drugPricesResponse.ok) {
      const errorText = await drugPricesResponse.text();
      console.error(`Drug prices API error: ${drugPricesResponse.status} - ${errorText}`);
    } else {
      const drugPricesData = await drugPricesResponse.json();
      console.log('Drug prices API response summary:');
      console.log(`- Pharmacies: ${drugPricesData.pharmacies?.length || 0}`);
      console.log(`- Brand Variations: ${drugPricesData.brandVariations?.length || 0}`);
      console.log(`- Forms: ${drugPricesData.forms?.length || 0}`);
      console.log(`- Strengths: ${drugPricesData.strengths?.length || 0}`);
      console.log(`- Quantities: ${drugPricesData.quantities?.length || 0}`);
      
      if (drugPricesData.error) {
        console.error('Error in drug prices response:', drugPricesData.error);
      }
      
      if (drugPricesData.usingMockData) {
        console.log('Using mock data: true');
      }
      
      // Print the first few pharmacies if available
      if (drugPricesData.pharmacies && drugPricesData.pharmacies.length > 0) {
        console.log('\nFirst 3 pharmacies:');
        drugPricesData.pharmacies.slice(0, 3).forEach((pharmacy, index) => {
          console.log(`${index + 1}. ${pharmacy.name || pharmacy.pharmacy?.name || 'Unknown'} - $${pharmacy.price || 'N/A'}`);
        });
      } else {
        console.log('\nNo pharmacies found in the response.');
      }
      
      // Print brand variations if available
      if (drugPricesData.brandVariations && drugPricesData.brandVariations.length > 0) {
        console.log('\nBrand variations:');
        drugPricesData.brandVariations.forEach((variation, index) => {
          console.log(`${index + 1}. ${variation.name} (${variation.type}) - GSN: ${variation.gsn}`);
        });
      }
    }
    
    // Step 3: Test the drug page directly
    console.log('\n--- Step 3: Testing Drug Page Directly ---');
    const drugPageUrl = `${deploymentUrl}/drug/${encodeURIComponent(drugName)}`;
    console.log(`Fetching drug page from: ${drugPageUrl}`);
    
    const drugPageResponse = await fetch(drugPageUrl);
    
    console.log(`Drug page status: ${drugPageResponse.status}`);
    
    if (!drugPageResponse.ok) {
      const errorText = await drugPageResponse.text();
      console.error(`Drug page error: ${drugPageResponse.status} - ${errorText}`);
    } else {
      const drugPageHtml = await drugPageResponse.text();
      
      // Check for loading skeletons
      const hasLoadingSkeletons = drugPageHtml.includes('animate-pulse');
      console.log(`Has loading skeletons: ${hasLoadingSkeletons}`);
      
      // Check for error messages
      const errorMatch = drugPageHtml.match(/<div[^>]*class="[^"]*text-red-500[^"]*"[^>]*>(.*?)<\/div>/);
      if (errorMatch) {
        console.log(`Error message found: ${errorMatch[1]}`);
      }
      
      // Check for pharmacy prices section
      const hasPharmacyPrices = drugPageHtml.includes('Pharmacy Prices');
      console.log(`Has pharmacy prices section: ${hasPharmacyPrices}`);
      
      // Check for brand variations section
      const hasBrandVariations = drugPageHtml.includes('Brand/Generic Variations');
      console.log(`Has brand variations section: ${hasBrandVariations}`);
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testDrugPage(); 