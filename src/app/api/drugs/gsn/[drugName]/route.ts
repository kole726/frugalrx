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
    
    // STEP 1: Use opFindDrugByName to get the GSN
    // Construct the endpoint path carefully to avoid duplication
    const findDrugEndpoint = baseUrl.includes('/pricing/v1') 
      ? `/drugs/${encodeURIComponent(drugName)}`
      : `/pricing/v1/drugs/${encodeURIComponent(drugName)}`;
    
    console.log(`Server: Step 1 - Using opFindDrugByName endpoint: ${baseUrl}${findDrugEndpoint}`);
    
    // Create URL with query parameters
    const url = new URL(`${baseUrl}${findDrugEndpoint}`);
    url.searchParams.append('count', '10'); // Limit results
    url.searchParams.append('hqAlias', process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx');
    
    console.log(`Full request URL: ${url.toString()}`);
    
    // Make API request to find drug by name
    const findDrugResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!findDrugResponse.ok) {
      const errorText = await findDrugResponse.text();
      console.error(`Server: opFindDrugByName API error (${findDrugResponse.status}):`, errorText);
      console.error(`Request details: opFindDrugByName for "${drugName}", endpoint=${url.toString()}`);
      throw new Error(`opFindDrugByName API Error ${findDrugResponse.status}: ${errorText}`);
    }
    
    const drugResults = await findDrugResponse.json();
    
    if (!Array.isArray(drugResults) || drugResults.length === 0) {
      console.log(`Server: No drug results found for "${drugName}"`);
      return undefined;
    }
    
    // Find the closest match to the drug name
    const normalizedDrugName = drugName.toLowerCase();
    const matchedDrug = drugResults.find(drug => 
      typeof drug === 'string' && drug.toLowerCase().includes(normalizedDrugName)
    ) || drugResults[0];
    
    if (!matchedDrug) {
      console.log(`Server: No matching drug found for "${drugName}"`);
      return undefined;
    }
    
    console.log(`Server: Found matching drug: "${matchedDrug}"`);
    
    // STEP 2: Try to extract GSN from the drug name if it's in the format "DRUG NAME (GSN: 12345)"
    const gsnMatch = typeof matchedDrug === 'string' ? matchedDrug.match(/\(GSN: (\d+)\)/i) : null;
    if (gsnMatch && gsnMatch[1]) {
      const gsn = parseInt(gsnMatch[1], 10);
      console.log(`Server: Extracted GSN ${gsn} from drug name "${matchedDrug}"`);
      return gsn;
    }
    
    // STEP 3: If GSN not in the name, use opGetDrugInfo to get detailed info
    // We need to make another API call to get the GSN using the drug info endpoint
    // First, try with the exact drug name from the search results
    const drugInfoEndpoint = baseUrl.includes('/pricing/v1') 
      ? `/druginfo/${encodeURIComponent(matchedDrug)}`
      : `/pricing/v1/druginfo/${encodeURIComponent(matchedDrug)}`;
    
    console.log(`Server: Step 3 - Using opGetDrugInfo endpoint with drug name: ${baseUrl}${drugInfoEndpoint}`);
    
    try {
      const drugInfoResponse = await fetch(`${baseUrl}${drugInfoEndpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (drugInfoResponse.ok) {
        const drugInfo = await drugInfoResponse.json();
        if (drugInfo && drugInfo.gsn) {
          console.log(`Server: Successfully retrieved GSN ${drugInfo.gsn} for drug "${matchedDrug}"`);
          return drugInfo.gsn;
        }
      } else {
        console.log(`Server: Drug info endpoint failed with status ${drugInfoResponse.status}, will try alternative approach`);
      }
    } catch (error) {
      console.error('Error getting drug info by name:', error);
    }
    
    // STEP 4: If we still don't have a GSN, try the drug prices endpoint which might return a GSN
    try {
      const pricesEndpoint = baseUrl.includes('/pricing/v1') 
        ? `/drugprices/byName`
        : `/pricing/v1/drugprices/byName`;
      
      console.log(`Server: Step 4 - Trying prices endpoint to get GSN: ${baseUrl}${pricesEndpoint}`);
      
      const pricesResponse = await fetch(`${baseUrl}${pricesEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
          drugName: matchedDrug,
          latitude: 30.4015,
          longitude: -97.7527,
          radius: 10,
          maximumPharmacies: 1
        }),
        cache: 'no-store'
      });
      
      if (pricesResponse.ok) {
        const pricesData = await pricesResponse.json();
        if (pricesData && pricesData.gsn) {
          console.log(`Server: Retrieved GSN ${pricesData.gsn} from prices endpoint for drug "${matchedDrug}"`);
          return pricesData.gsn;
        }
      }
    } catch (error) {
      console.error('Error getting drug prices to extract GSN:', error);
    }
    
    console.log(`Server: Could not find GSN for drug "${drugName}" after trying multiple approaches`);
    return undefined;
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
  const drug = MOCK_DRUGS.find(drug => 
    drug.drugName.includes(normalizedDrugName) || normalizedDrugName.includes(drug.drugName)
  );
  
  return drug?.gsn;
} 