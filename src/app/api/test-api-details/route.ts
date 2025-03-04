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

export async function GET() {
  try {
    console.log('API: Running detailed API tests');
    
    // Get environment variables (excluding secrets)
    const envInfo = {
      apiUrl: process.env.AMERICAS_PHARMACY_API_URL,
      authUrl: process.env.AMERICAS_PHARMACY_AUTH_URL,
      clientId: process.env.AMERICAS_PHARMACY_CLIENT_ID ? 'Set' : 'Not set',
      clientSecret: process.env.AMERICAS_PHARMACY_CLIENT_SECRET ? 'Set' : 'Not set',
      hqMapping: process.env.AMERICAS_PHARMACY_HQ_MAPPING,
      useMockDrugInfo: process.env.NEXT_PUBLIC_USE_MOCK_DRUG_INFO,
      useRealApi: process.env.NEXT_PUBLIC_USE_REAL_API,
      nodeEnv: process.env.NODE_ENV
    };
    
    console.log('API: Environment variables:', envInfo);
    
    // Test authentication
    let authStatus = 'Not tested';
    let token = null;
    
    try {
      console.log('API: Testing authentication...');
      token = await getAuthToken();
      authStatus = token ? 'Success' : 'Failed (no token returned)';
      console.log('API: Authentication test result:', authStatus);
    } catch (authError) {
      authStatus = `Failed: ${authError instanceof Error ? authError.message : 'Unknown error'}`;
      console.error('API: Authentication test error:', authError);
    }
    
    // If authentication failed, return early
    if (!token) {
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        environment: envInfo,
        tests: {
          authentication: authStatus,
          apiConnection: 'Skipped (authentication failed)'
        }
      }, { headers: corsHeaders });
    }
    
    // Test API endpoints
    const testResults = {
      drugInfo: await testDrugInfoEndpoint(token),
      drugSearch: await testDrugSearchEndpoint(token),
      pharmacyPrices: await testPharmacyPricesEndpoint(token)
    };
    
    // Return the results
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envInfo,
      tests: {
        authentication: authStatus,
        endpoints: testResults
      }
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in test-api-details API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { 
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Test drug info endpoint
 */
async function testDrugInfoEndpoint(token: string) {
  try {
    console.log('API: Testing drug info endpoint');
    
    // Test GSN
    const gsn = 1790; // Tylenol
    
    // Get API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      return {
        success: false,
        error: 'API URL not configured'
      };
    }
    
    // Create URL
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const url = `${baseUrl}/pricing/v1/druginfo/${gsn}`;
    console.log(`API: Making request to: ${url}`);
    
    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    // Check response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API: Drug info endpoint error (${response.status}):`, errorText);
      
      // Try alternative URL structure
      console.log('API: Trying alternative URL structure');
      const altUrl = `${baseUrl}/v1/druginfo/${gsn}`;
      console.log(`API: Making request to: ${altUrl}`);
      
      const altResponse = await fetch(altUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!altResponse.ok) {
        const altErrorText = await altResponse.text();
        console.error(`API: Alternative drug info endpoint error (${altResponse.status}):`, altErrorText);
        
        return {
          success: false,
          status: response.status,
          error: errorText,
          altStatus: altResponse.status,
          altError: altErrorText,
          url: url,
          altUrl: altUrl
        };
      }
      
      // Alternative URL worked
      const altData = await altResponse.json();
      console.log('API: Alternative drug info endpoint success');
      
      return {
        success: true,
        status: altResponse.status,
        data: 'Data retrieved successfully',
        url: altUrl,
        note: 'Used alternative URL structure'
      };
    }
    
    // Original URL worked
    const data = await response.json();
    console.log('API: Drug info endpoint success');
    
    return {
      success: true,
      status: response.status,
      data: 'Data retrieved successfully',
      url: url
    };
  } catch (error) {
    console.error('API: Error testing drug info endpoint:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test drug search endpoint
 */
async function testDrugSearchEndpoint(token: string) {
  try {
    console.log('API: Testing drug search endpoint');
    
    // Test query
    const query = 'tylenol';
    
    // Get API URL and HQ mapping
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    const hqMapping = process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx';
    
    if (!apiUrl) {
      return {
        success: false,
        error: 'API URL not configured'
      };
    }
    
    // Create URL
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const url = `${baseUrl}/drugs/names`;
    console.log(`API: Making request to: ${url}`);
    
    // Make API request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        hqMappingName: hqMapping,
        prefixText: query.toLowerCase()
      })
    });
    
    // Check response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API: Drug search endpoint error (${response.status}):`, errorText);
      
      // Try alternative URL structure
      console.log('API: Trying alternative URL structure');
      const altUrl = `${baseUrl}/v1/drugs/names`;
      console.log(`API: Making request to: ${altUrl}`);
      
      const altResponse = await fetch(altUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          hqMappingName: hqMapping,
          prefixText: query.toLowerCase()
        })
      });
      
      if (!altResponse.ok) {
        const altErrorText = await altResponse.text();
        console.error(`API: Alternative drug search endpoint error (${altResponse.status}):`, altErrorText);
        
        return {
          success: false,
          status: response.status,
          error: errorText,
          altStatus: altResponse.status,
          altError: altErrorText,
          url: url,
          altUrl: altUrl
        };
      }
      
      // Alternative URL worked
      const altData = await altResponse.json();
      console.log('API: Alternative drug search endpoint success');
      
      return {
        success: true,
        status: altResponse.status,
        data: 'Data retrieved successfully',
        url: altUrl,
        note: 'Used alternative URL structure'
      };
    }
    
    // Original URL worked
    const data = await response.json();
    console.log('API: Drug search endpoint success');
    
    return {
      success: true,
      status: response.status,
      data: 'Data retrieved successfully',
      url: url
    };
  } catch (error) {
    console.error('API: Error testing drug search endpoint:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test pharmacy prices endpoint
 */
async function testPharmacyPricesEndpoint(token: string) {
  try {
    console.log('API: Testing pharmacy prices endpoint');
    
    // Test GSN
    const gsn = 1790; // Tylenol
    
    // Test location (Austin, TX)
    const location = {
      latitude: 30.2672,
      longitude: -97.7431,
      radius: 10
    };
    
    // Get API URL and HQ mapping
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    const hqMapping = process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx';
    
    if (!apiUrl) {
      return {
        success: false,
        error: 'API URL not configured'
      };
    }
    
    // Create URL
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const url = `${baseUrl}/pricing/v1/pharmacyprices`;
    console.log(`API: Making request to: ${url}`);
    
    // Make API request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        hqMappingName: hqMapping,
        gsn: gsn,
        latitude: location.latitude,
        longitude: location.longitude,
        radius: location.radius
      })
    });
    
    // Check response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API: Pharmacy prices endpoint error (${response.status}):`, errorText);
      
      // Try alternative URL structure
      console.log('API: Trying alternative URL structure');
      const altUrl = `${baseUrl}/v1/pharmacyprices`;
      console.log(`API: Making request to: ${altUrl}`);
      
      const altResponse = await fetch(altUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          hqMappingName: hqMapping,
          gsn: gsn,
          latitude: location.latitude,
          longitude: location.longitude,
          radius: location.radius
        })
      });
      
      if (!altResponse.ok) {
        const altErrorText = await altResponse.text();
        console.error(`API: Alternative pharmacy prices endpoint error (${altResponse.status}):`, altErrorText);
        
        return {
          success: false,
          status: response.status,
          error: errorText,
          altStatus: altResponse.status,
          altError: altErrorText,
          url: url,
          altUrl: altUrl
        };
      }
      
      // Alternative URL worked
      const altData = await altResponse.json();
      console.log('API: Alternative pharmacy prices endpoint success');
      
      return {
        success: true,
        status: altResponse.status,
        data: 'Data retrieved successfully',
        url: altUrl,
        note: 'Used alternative URL structure'
      };
    }
    
    // Original URL worked
    const data = await response.json();
    console.log('API: Pharmacy prices endpoint success');
    
    return {
      success: true,
      status: response.status,
      data: 'Data retrieved successfully',
      url: url
    };
  } catch (error) {
    console.error('API: Error testing pharmacy prices endpoint:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 