import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { getDetailedDrugInfo } from '@/lib/server/medicationService';
import { DrugDetails, APIError } from '@/types/api';
import { getMockDrugInfo } from '@/lib/mockData';
import { getAuthToken } from '@/lib/server/auth';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gsn = searchParams.get('gsn');
    const languageCode = searchParams.get('languageCode') || 'en';

    if (!gsn) {
      return NextResponse.json(
        { error: 'GSN parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const gsnNumber = parseInt(gsn, 10);
    if (isNaN(gsnNumber)) {
      return NextResponse.json(
        { error: 'GSN must be a valid number' },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      // Get real data from the API
      console.log(`API: Getting detailed drug info for GSN: ${gsnNumber}`);
      const drugInfo = await getDetailedDrugInfo(gsnNumber, languageCode);
      
      // Now also fetch the forms, strengths, and quantities from the drugprices/byGSN endpoint
      console.log(`API: Getting additional drug details from drugprices/byGSN for GSN: ${gsnNumber}`);
      
      // Get API URL from environment variables
      const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }
      
      // Format the base URL
      let baseUrl = apiUrl;
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
      // Get authentication token
      const token = await getAuthToken();
      
      // Determine the endpoint
      const endpoint = baseUrl.includes('/pricing/v1') 
        ? `${baseUrl}/drugprices/byGSN`
        : `${baseUrl}/pricing/v1/drugprices/byGSN`;
      
      const hqMappingName = process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx';
      
      // Create the request payload
      const payload = {
        hqMappingName,
        gsn: gsnNumber,
        latitude: 30.2672,
        longitude: -97.7431,
        customizedQuantity: false,
        quantity: 30
      };
      
      // Make the API request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      // Combine the data
      let combinedData = { ...drugInfo };
      
      if (response.ok) {
        const priceData = await response.json();
        console.log(`API: Successfully retrieved additional drug details from drugprices/byGSN`);
        
        // Add forms, strengths, and quantities to the combined data
        if (priceData.forms) {
          combinedData.forms = priceData.forms;
        }
        
        if (priceData.strengths) {
          combinedData.strengths = priceData.strengths;
        }
        
        if (priceData.quantities) {
          combinedData.quantities = priceData.quantities;
        }
        
        // If drug name is missing in drugInfo, use the one from priceData
        if (!combinedData.brandName && priceData.drug?.medName) {
          combinedData.brandName = priceData.drug.medName;
        }
        
        if (!combinedData.genericName && priceData.drug?.medName) {
          combinedData.genericName = priceData.drug.medName;
        }
      } else {
        console.log(`API: Failed to get additional drug details from drugprices/byGSN: ${response.status}`);
      }
      
      // Log the combined drug info we're returning
      console.log(`API: Returning combined drug info for GSN ${gsnNumber}:`, combinedData);
      
      return NextResponse.json(combinedData, { headers: corsHeaders });
    } catch (error) {
      console.error('API: Error fetching detailed drug info, falling back to mock data:', error);
      
      // Fall back to mock data if API fails
      const mockDrug = getMockDrugInfo(`GSN:${gsnNumber}`);
      
      console.log(`API: Returning mock drug info for GSN ${gsnNumber}:`, mockDrug);
      return NextResponse.json({
        ...mockDrug,
        error: error instanceof Error ? error.message : 'Unknown error',
        usingMockData: true
      }, { headers: corsHeaders });
    }
  } catch (error) {
    console.error('Error fetching drug info by GSN:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 