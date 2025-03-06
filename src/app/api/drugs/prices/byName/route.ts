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

/**
 * Find the GSN for a drug name by searching the API
 * @param drugName The name of the drug
 * @returns The GSN if found, otherwise undefined
 */
async function findGsnForDrugName(drugName: string): Promise<number | undefined> {
  try {
    console.log(`Server: Searching for GSN for drug: "${drugName}"`);
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Get authentication token
    const token = await getAuthToken();
    
    // Use the correct endpoint from the API documentation
    const endpoint = `/druginfo/${encodeURIComponent(drugName)}`;
    
    // Check if baseUrl already includes the pricing/v1 path
    const fullEndpoint = baseUrl.includes('/pricing/v1') ? endpoint : `/pricing/v1${endpoint}`;
    
    console.log(`Server: Trying GET request to ${baseUrl}${fullEndpoint}`);
    
    // Make API request
    const response = await fetch(`${baseUrl}${fullEndpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Server: API error (${response.status}):`, errorText);
      console.error(`Request details: GSN search for "${drugName}", endpoint=${baseUrl}${fullEndpoint}`);
      return undefined; // Return undefined instead of throwing an error
    }

    const data = await response.json();
    console.log(`Server: Successfully retrieved GSN for drug "${drugName}":`, data.gsn);
    
    return data.gsn;
  } catch (error) {
    console.error('Error finding GSN for drug:', error);
    return undefined;
  }
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
      
      // Prepare the API request
      const apiUrl = process.env.AMERICAS_PHARMACY_API_URL || 'https://api.americaspharmacy.com';
      const baseUrl = apiUrl.replace(/\/+$/, '');
      
      // First, try to get the GSN for the drug name
      console.log(`Attempting to find GSN for drug name: "${drugName}"`);
      const gsn = await findGsnForDrugName(drugName);
      
      // If we found a GSN, use it to get prices
      if (gsn) {
        console.log(`Found GSN ${gsn} for drug "${drugName}", using it to get prices`);
        
        // Check if baseUrl already includes /pricing/v1 to avoid duplication
        const baseUrlHasPath = baseUrl.includes('/pricing/v1');
        
        // Construct the endpoint path carefully to avoid duplication
        const endpoint = baseUrlHasPath ? '/drugprices/byGSN' : '/pricing/v1/drugprices/byGSN';
        
        console.log(`Using America's Pharmacy API with GSN: ${baseUrl}${endpoint}`);
        console.log(`Full API URL: ${baseUrl}${endpoint}`);
        
        // Prepare the request body for GSN request
        const gsnRequestBody: any = {
          hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
          gsn: gsn,
          latitude: parseFloat(latitude.toString()),
          longitude: parseFloat(longitude.toString()),
          radius: body.radius || 50,
          maximumPharmacies: body.maximumPharmacies || 10
        };
        
        // Add optional parameters if provided
        if (customizedQuantity && quantity) {
          gsnRequestBody.customizedQuantity = true;
          gsnRequestBody.quantity = parseInt(quantity.toString(), 10);
        }
        
        console.log('GSN Request body:', gsnRequestBody);
        
        // Make the API request with GSN
        const gsnResponse = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(gsnRequestBody),
          cache: 'no-store'
        });
        
        if (gsnResponse.ok) {
          const gsnData = await gsnResponse.json();
          console.log(`API returned data for drug "${drugName}" using GSN ${gsn}`);
          
          // Add the drug name and GSN to the response
          const enhancedData = {
            ...gsnData,
            drugName: drugName,
            gsn: gsn
          };
          
          // Return the data
          return NextResponse.json(enhancedData, { headers: corsHeaders });
        } else {
          console.log(`GSN request failed with status ${gsnResponse.status}, falling back to drug name request`);
          // If GSN request fails, fall back to drug name request
        }
      }
      
      // If we didn't find a GSN or the GSN request failed, use the drug name
      console.log(`Using drug name "${drugName}" to get prices`);
      
      // Check if baseUrl already includes /pricing/v1 to avoid duplication
      const baseUrlHasPath = baseUrl.includes('/pricing/v1');
      
      // Construct the endpoint path carefully to avoid duplication
      const endpoint = baseUrlHasPath ? '/drugprices/byName' : '/pricing/v1/drugprices/byName';
      
      console.log(`Using America's Pharmacy API: ${baseUrl}${endpoint}`);
      console.log(`Full API URL: ${baseUrl}${endpoint}`);
      
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
      const response = await fetch(`${baseUrl}${endpoint}`, {
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
      
      // Return the data
      return NextResponse.json(data, { headers: corsHeaders });
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