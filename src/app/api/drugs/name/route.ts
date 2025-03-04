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
    
    const hqMappingName = process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx';
    
    // First try to get drug info directly from the druginfo endpoint
    const drugInfoUrl = `${baseUrl}/pricing/v1/druginfo/${gsn}`;
    
    console.log(`Trying to fetch drug name from: ${drugInfoUrl}`);
    
    try {
      const infoResponse = await fetch(drugInfoUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (infoResponse.ok) {
        const infoData = await infoResponse.json();
        console.log('Drug info response:', JSON.stringify(infoData).substring(0, 500) + '...');
        
        // Extract drug name from the response
        let drugName = '';
        let brandName = '';
        let genericName = '';
        
        // Check all possible locations for drug name information
        if (infoData.brandName) {
          brandName = infoData.brandName;
        } else if (infoData.genericName) {
          genericName = infoData.genericName;
        } else if (infoData.drugName) {
          drugName = infoData.drugName;
        }
        
        // Determine the best name to use
        let bestName = '';
        if (brandName) {
          bestName = brandName;
        } else if (genericName) {
          bestName = genericName;
        } else if (drugName) {
          bestName = drugName;
        }
        
        if (bestName) {
          return NextResponse.json({ 
            name: bestName,
            brandName,
            genericName,
            source: 'druginfo_endpoint'
          });
        }
      } else {
        console.log(`Drug info endpoint returned status: ${infoResponse.status}`);
        const errorText = await infoResponse.text().catch(() => 'Could not read response');
        console.log(`Error response: ${errorText}`);
      }
    } catch (error) {
      console.error('Error fetching from drug info endpoint:', error);
    }
    
    // If direct drug info fails, try the pricing endpoint
    const pricingUrl = baseUrl.includes('/pricing/v1') 
      ? `${baseUrl}/drugprices/byGSN`
      : `${baseUrl}/pricing/v1/drugprices/byGSN`;
    
    console.log(`Trying to fetch drug name from pricing endpoint: ${pricingUrl}`);
    
    const payload = {
      hqMappingName,
      gsn: parseInt(gsn),
      latitude: 30.2672,
      longitude: -97.7431,
      customizedQuantity: false,
      quantity: 30
    };
    
    try {
      const response = await fetch(pricingUrl, {
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
        console.log('Pricing endpoint response:', JSON.stringify(data).substring(0, 500) + '...');
        
        // Extract drug name from the response
        let brandName = '';
        let genericName = '';
        let drugName = '';
        
        // Check all possible locations for drug name information
        if (data.drugInfo?.brandName) {
          brandName = data.drugInfo.brandName;
        } 
        if (data.drugInfo?.genericName) {
          genericName = data.drugInfo.genericName;
        } 
        if (data.drugInfo?.drugName) {
          drugName = data.drugInfo.drugName;
        } else if (data.drugName) {
          drugName = data.drugName;
        }
        
        // Determine the best name to use
        let bestName = '';
        if (brandName) {
          bestName = brandName;
        } else if (genericName) {
          bestName = genericName;
        } else if (drugName) {
          bestName = drugName;
        }
        
        if (bestName) {
          return NextResponse.json({ 
            name: bestName,
            brandName,
            genericName,
            source: 'pricing_endpoint'
          });
        }
      } else {
        console.log(`Pricing endpoint returned status: ${response.status}`);
        const errorText = await response.text().catch(() => 'Could not read response');
        console.log(`Error response: ${errorText}`);
      }
    } catch (error) {
      console.error('Error fetching from pricing endpoint:', error);
    }
    
    // If we still don't have a name, try to search for drugs by prefix
    try {
      const searchUrl = `${baseUrl}/pricing/v1/drugs/names`;
      
      console.log(`Trying to search for drug names: ${searchUrl}`);
      
      const searchPayload = {
        hqMappingName,
        prefixText: "a" // Just to get some results
      };
      
      const searchResponse = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchPayload)
      });
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('Search results:', JSON.stringify(searchData).substring(0, 500) + '...');
        
        // If we got search results, it means the API is working but the GSN might be invalid
        return NextResponse.json({ 
          error: 'Could not find drug name for this GSN',
          message: 'The GSN may be invalid or not in the database. Try a different GSN or search by drug name.',
          validApiConnection: true,
          gsn
        }, { status: 404 });
      } else {
        console.log(`Search endpoint returned status: ${searchResponse.status}`);
        const errorText = await searchResponse.text().catch(() => 'Could not read response');
        console.log(`Error response: ${errorText}`);
      }
    } catch (error) {
      console.error('Error searching for drugs:', error);
    }
    
    // If we couldn't get the name, return an error
    return NextResponse.json({ 
      error: 'Could not find drug name',
      message: 'Unable to retrieve drug information from the API. The GSN may be invalid or the API may be experiencing issues.',
      gsn
    }, { status: 404 });
    
  } catch (error) {
    console.error('Error fetching drug name:', error);
    return NextResponse.json(
      { 
        error: `Error fetching drug name: ${error instanceof Error ? error.message : 'Unknown error'}`,
        gsn
      },
      { status: 500 }
    );
  }
} 