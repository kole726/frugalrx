import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/server/auth';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Server: Successfully retrieved GSN for drug "${drugName}":`, data.gsn);
    
    return data.gsn;
  } catch (error) {
    console.error('Error finding GSN for drug:', error);
    return undefined;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { drugName: string } }
) {
  try {
    // Extract the drug name from the params
    const drugName = params.drugName;
    
    console.log(`API Drug GSN: Received request for drug "${drugName}"`);
    
    if (!drugName) {
      console.error('API Drug GSN: Missing drug name');
      return NextResponse.json(
        { error: 'Drug name is required' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    // Try to find the GSN for the drug name
    try {
      const gsn = await findGsnForDrugName(drugName);
      
      if (gsn) {
        console.log(`API Drug GSN: Found GSN ${gsn} for drug "${drugName}"`);
        return NextResponse.json({ drugName, gsn }, { headers: corsHeaders });
      } else {
        console.log(`API Drug GSN: No GSN found for drug "${drugName}"`);
        return NextResponse.json(
          { error: `No GSN found for drug "${drugName}"` },
          { 
            status: 404,
            headers: corsHeaders
          }
        );
      }
    } catch (apiError: any) {
      console.error('Error connecting to America\'s Pharmacy API:', apiError);
      
      // Check if we have a mock GSN for this drug
      const mockGsn = getMockGsnForDrugName(drugName);
      if (mockGsn) {
        console.log(`API Drug GSN: Using mock GSN ${mockGsn} for drug "${drugName}"`);
        return NextResponse.json(
          { drugName, gsn: mockGsn, isMockData: true },
          { 
            headers: {
              ...corsHeaders,
              'X-Data-Source': 'mock',
              'X-Warning': 'Using mock data due to API connectivity issues'
            }
          }
        );
      }
      
      return NextResponse.json(
        { error: apiError instanceof Error ? apiError.message : 'Unknown error' },
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }
  } catch (error: any) {
    console.error('Error in drug GSN API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

/**
 * Get a mock GSN for a drug name
 * @param drugName The name of the drug
 * @returns A mock GSN if available, otherwise undefined
 */
function getMockGsnForDrugName(drugName: string): number | undefined {
  const normalizedDrugName = drugName.toLowerCase();
  
  // Mock data for common medications
  const MOCK_DRUGS = [
    { drugName: 'amoxicillin', gsn: 1234 },
    { drugName: 'lisinopril', gsn: 2345 },
    { drugName: 'atorvastatin', gsn: 3456 },
    { drugName: 'metformin', gsn: 4567 },
    { drugName: 'levothyroxine', gsn: 5678 },
    { drugName: 'amlodipine', gsn: 6789 },
    { drugName: 'metoprolol', gsn: 7890 },
    { drugName: 'albuterol', gsn: 8901 },
    { drugName: 'omeprazole', gsn: 9012 },
    { drugName: 'losartan', gsn: 1023 },
    { drugName: 'gabapentin', gsn: 2134 },
    { drugName: 'hydrochlorothiazide', gsn: 3245 },
    { drugName: 'sertraline', gsn: 4356 },
    { drugName: 'simvastatin', gsn: 5467 },
    { drugName: 'vyvanse', gsn: 6578 },
    { drugName: 'tylenol', gsn: 1790 },
    { drugName: 'tylox', gsn: 8790 },
    { drugName: 'tylenol with codeine', gsn: 9801 },
    { drugName: 'tylenol pm', gsn: 1012 },
    { drugName: 'tylenol cold', gsn: 2123 }
  ];
  
  // Find the drug in the mock data
  const drug = MOCK_DRUGS.find(drug => drug.drugName.includes(normalizedDrugName) || normalizedDrugName.includes(drug.drugName));
  
  return drug?.gsn;
} 