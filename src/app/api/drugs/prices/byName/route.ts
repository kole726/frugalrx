import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/server/auth';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Define the request body interface
interface DrugPriceRequestBody {
  hqMappingName: string;
  drugName: string;
  latitude: number;
  longitude: number;
  radius?: number;
  maximumPharmacies?: number;
  customizedQuantity?: boolean;
  quantity?: number;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    const { drugName, latitude, longitude, quantity, customizedQuantity } = body;
    
    if (!drugName) {
      return NextResponse.json(
        { error: 'Drug name is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`Drug Prices API: Fetching prices for drug "${drugName}" at location (${latitude}, ${longitude})`);
    
    try {
      // Get authentication token
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('Failed to obtain authentication token');
      }
      
      console.log('Successfully obtained authentication token');
      
      // Prepare the API URLs
      const americasPharmacyApiUrl = process.env.AMERICAS_PHARMACY_API_URL || 'https://api.americaspharmacy.com';
      const americasPharmacyBaseUrl = americasPharmacyApiUrl.replace(/\/+$/, '');
      
      // Use opGetPharmacyDrugPricingbyName directly to get both GSN and pharmacy data
      console.log(`Using opGetPharmacyDrugPricingbyName for drug "${drugName}"`);
      
      // Check if baseUrl already includes /pricing/v1 to avoid duplication
      const baseUrlHasPath = americasPharmacyBaseUrl.includes('/pricing/v1');
      
      // Construct the endpoint path carefully to avoid duplication
      const endpoint = baseUrlHasPath ? '/drugprices/byName' : '/pricing/v1/drugprices/byName';
      
      console.log(`Using America's Pharmacy API: ${americasPharmacyBaseUrl}${endpoint}`);
      console.log(`Full API URL: ${americasPharmacyBaseUrl}${endpoint}`);
      
      // Prepare the request body
      const requestBody: DrugPriceRequestBody = {
        hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
        drugName: drugName,
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString()),
        radius: body.radius || 50,
        maximumPharmacies: body.maximumPharmacies || 10
      };
      
      // Add optional parameters if provided
      if (customizedQuantity && quantity) {
        requestBody.customizedQuantity = true;
        requestBody.quantity = parseInt(quantity.toString(), 10);
      }
      
      console.log('Request body:', requestBody);
      
      // Make the API request
      const response = await fetch(`${americasPharmacyBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error: ${response.status}`, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`API returned data for drug "${drugName}"`);
      
      // Add detailed logging to verify the structure of the response
      console.log('Response data structure check:');
      console.log('- Has drug info:', !!data.drug);
      if (data.drug) {
        console.log('  - Drug name:', data.drug.medName);
        console.log('  - GSN:', data.drug.gsn);
        console.log('  - NDC Code:', data.drug.ndcCode);
      }
      
      console.log('- Has pharmacyPrices:', !!data.pharmacyPrices && Array.isArray(data.pharmacyPrices));
      if (data.pharmacyPrices && Array.isArray(data.pharmacyPrices)) {
        console.log('  - Number of pharmacies:', data.pharmacyPrices.length);
        if (data.pharmacyPrices.length > 0) {
          const firstPharmacy = data.pharmacyPrices[0];
          console.log('  - First pharmacy name:', firstPharmacy.pharmacy?.name);
          console.log('  - First pharmacy price:', firstPharmacy.price?.price);
        }
      }
      
      console.log('- Has forms:', !!data.forms && Array.isArray(data.forms));
      if (data.forms && Array.isArray(data.forms)) {
        console.log('  - Number of forms:', data.forms.length);
        console.log('  - Available forms:', data.forms.map((form: any) => form.form).join(', '));
      }
      
      console.log('- Has strengths:', !!data.strengths && Array.isArray(data.strengths));
      if (data.strengths && Array.isArray(data.strengths)) {
        console.log('  - Number of strengths:', data.strengths.length);
        console.log('  - Available strengths:', data.strengths.map((strength: any) => strength.strength).join(', '));
      }
      
      console.log('- Has quantities:', !!data.quantities && Array.isArray(data.quantities));
      if (data.quantities && Array.isArray(data.quantities)) {
        console.log('  - Number of quantities:', data.quantities.length);
        console.log('  - Available quantities:', data.quantities.map((qty: any) => `${qty.quantity} ${qty.uom}`).join(', '));
      }
      
      console.log('- Has alternateDrugs:', !!data.alternateDrugs && Array.isArray(data.alternateDrugs));
      if (data.alternateDrugs && Array.isArray(data.alternateDrugs)) {
        console.log('  - Number of alternate drugs:', data.alternateDrugs.length);
        if (data.alternateDrugs.length > 0) {
          console.log('  - First few alternates:', data.alternateDrugs.slice(0, 3).map((drug: any) => drug.medName).join(', '));
        }
      }
      
      // Extract GSN from the response if available
      if (data && data.drug && data.drug.gsn) {
        console.log(`Found GSN ${data.drug.gsn} for drug "${drugName}" in the API response`);
      } else {
        console.log(`No GSN found for drug "${drugName}" in the API response`);
      }
      
      // Ensure the drug name is included in the response
      const enhancedData = {
        ...data,
        drugName: drugName
      };
      
      // Return the data
      return NextResponse.json(enhancedData, { headers: corsHeaders });
    } catch (apiError) {
      console.error('Error connecting to America\'s Pharmacy API:', apiError);
      throw apiError;
    }
  } catch (error) {
    console.error('Error in drug prices API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
} 