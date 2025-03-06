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
      
      // Prepare the API request
      const apiUrl = process.env.AMERICAS_PHARMACY_API_URL || 'https://api.americaspharmacy.com';
      const baseUrl = apiUrl.replace(/\/+$/, '');
      
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