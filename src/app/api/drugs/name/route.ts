import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gsn = searchParams.get('gsn');
  
  if (!gsn) {
    return NextResponse.json({ error: 'GSN parameter is required' }, { status: 400 });
  }
  
  try {
    // Get API URL from environment variables
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      return NextResponse.json({ error: 'API URL not configured' }, { status: 500 });
    }
    
    // Get authentication token
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ error: 'Failed to obtain authentication token' }, { status: 401 });
    }
    
    // Format the base URL
    let baseUrl = apiUrl;
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    // First try to get drug info which should contain the name
    const drugInfoUrl = baseUrl.includes('/pricing/v1') 
      ? `${baseUrl}/drugprices/byGSN`
      : `${baseUrl}/pricing/v1/drugprices/byGSN`;
    
    const hqMappingName = process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx';
    
    const payload = {
      hqMappingName,
      gsn: parseInt(gsn),
      latitude: 30.2672,
      longitude: -97.7431,
      customizedQuantity: false,
      quantity: 30
    };
    
    const response = await fetch(drugInfoUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Extract drug name from the response
      let drugName = '';
      
      if (data.drugInfo?.drugName) {
        drugName = data.drugInfo.drugName;
      } else if (data.drugInfo?.brandName) {
        drugName = data.drugInfo.brandName;
      } else if (data.drugInfo?.genericName) {
        drugName = data.drugInfo.genericName;
      } else if (data.drugName) {
        drugName = data.drugName;
      }
      
      if (drugName) {
        return NextResponse.json({ name: drugName });
      }
    }
    
    // If we couldn't get the name, return an error
    return NextResponse.json({ error: 'Could not find drug name' }, { status: 404 });
    
  } catch (error) {
    console.error('Error fetching drug name:', error);
    return NextResponse.json(
      { error: `Error fetching drug name: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 