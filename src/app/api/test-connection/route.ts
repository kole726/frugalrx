import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/server/auth';
import { testApiConnection } from '@/lib/server/medicationService';

export const dynamic = 'force-dynamic';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  console.log('Testing connection and authentication...');
  
  // Get environment variables
  const apiUrl = process.env.AMERICAS_PHARMACY_API_URL || '';
  const authUrl = process.env.AMERICAS_PHARMACY_AUTH_URL || '';
  const clientId = process.env.AMERICAS_PHARMACY_CLIENT_ID || '';
  const clientSecret = process.env.AMERICAS_PHARMACY_CLIENT_SECRET || '';
  const hqMapping = process.env.AMERICAS_PHARMACY_HQ_MAPPING || '';
  const useMockDrugInfo = process.env.NEXT_PUBLIC_USE_MOCK_DRUG_INFO || '';
  const useMockPharmacyPrices = process.env.NEXT_PUBLIC_USE_MOCK_PHARMACY_PRICES || '';
  const useMockDrugSearch = process.env.NEXT_PUBLIC_USE_MOCK_DRUG_SEARCH || '';
  const useRealApi = process.env.NEXT_PUBLIC_USE_REAL_API || '';
  const fallbackToMock = process.env.NEXT_PUBLIC_FALLBACK_TO_MOCK || '';
  const nodeEnv = process.env.NODE_ENV || '';
  
  console.log('Environment variables:', { 
    apiUrl: apiUrl ? 'Set' : 'Not set',
    authUrl: authUrl ? 'Set' : 'Not set',
    clientId: clientId ? 'Set' : 'Not set',
    clientSecret: clientSecret ? 'Set' : 'Not set',
    hqMapping,
    useMockDrugInfo,
    useMockPharmacyPrices,
    useMockDrugSearch,
    useRealApi,
    fallbackToMock,
    nodeEnv
  });
  
  // Test authentication
  let authResult = {
    success: false,
    message: 'Authentication failed',
    token: ''
  };
  
  try {
    console.log('Testing authentication...');
    const token = await getAuthToken();
    
    if (token) {
      authResult = {
        success: true,
        message: 'Successfully authenticated with the API',
        token
      };
      console.log('Authentication successful');
    } else {
      authResult.message = 'Failed to obtain authentication token';
      console.log('Authentication failed: No token received');
    }
  } catch (error) {
    authResult.message = `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('Authentication error:', error);
  }
  
  // Test specific API endpoints
  let endpointTests = {
    drugInfo: {
      success: false,
      status: 0,
      url: '',
      data: null as any
    },
    drugSearch: {
      success: false,
      status: 0,
      url: '',
      data: null as any
    },
    pharmacyPrices: {
      success: false,
      status: 0,
      url: '',
      data: null as any
    }
  };
  
  if (authResult.success) {
    try {
      console.log('Testing API endpoints...');
      
      // Validate API URL
      if (!apiUrl) {
        console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
        throw new Error('API URL not configured');
      }
      
      // Ensure the URL is properly formatted by removing trailing slashes
      let baseUrl = apiUrl;
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
      const token = authResult.token;
      const hqMappingName = hqMapping || 'walkerrx';
      
      // 1. Test Drug Info Endpoint
      try {
        const gsn = 62733; // Known working GSN
        const drugInfoUrl = baseUrl.includes('/pricing/v1') 
          ? `${baseUrl}/drugprices/byGSN`
          : `${baseUrl}/pricing/v1/drugprices/byGSN`;
        
        console.log(`Testing Drug Info endpoint: ${drugInfoUrl}`);
        
        const payload = {
          hqMappingName,
          gsn,
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
        
        endpointTests.drugInfo.status = response.status;
        endpointTests.drugInfo.url = drugInfoUrl;
        
        if (response.ok) {
          const data = await response.json();
          endpointTests.drugInfo.success = true;
          endpointTests.drugInfo.data = `Data retrieved successfully for GSN ${gsn}`;
          console.log('Drug Info endpoint test successful');
        } else {
          const errorText = await response.text();
          console.error(`Drug Info endpoint test failed: ${response.status} ${response.statusText}`, errorText);
        }
      } catch (error) {
        console.error('Error testing Drug Info endpoint:', error);
      }
      
      // 2. Test Drug Search Endpoint
      try {
        const drugSearchUrl = baseUrl.includes('/pricing/v1') 
          ? `${baseUrl}/drugs/names`
          : `${baseUrl}/pricing/v1/drugs/names`;
        
        console.log(`Testing Drug Search endpoint: ${drugSearchUrl}`);
        
        const payload = {
          hqMappingName,
          prefixText: "tylenol"
        };
        
        const response = await fetch(drugSearchUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        endpointTests.drugSearch.status = response.status;
        endpointTests.drugSearch.url = drugSearchUrl;
        
        if (response.ok) {
          const data = await response.json();
          endpointTests.drugSearch.success = true;
          endpointTests.drugSearch.data = 'Data retrieved successfully';
          console.log('Drug Search endpoint test successful');
        } else {
          const errorText = await response.text();
          console.error(`Drug Search endpoint test failed: ${response.status} ${response.statusText}`, errorText);
        }
      } catch (error) {
        console.error('Error testing Drug Search endpoint:', error);
      }
      
      // 3. Test Pharmacy Prices Endpoint
      try {
        const gsn = 62733; // Known working GSN
        const pharmacyPricesUrl = baseUrl.includes('/pricing/v1') 
          ? `${baseUrl}/drugprices/byGSN`
          : `${baseUrl}/pricing/v1/drugprices/byGSN`;
        
        console.log(`Testing Pharmacy Prices endpoint: ${pharmacyPricesUrl}`);
        
        const payload = {
          hqMappingName,
          gsn,
          latitude: 30.2672,
          longitude: -97.7431,
          customizedQuantity: false,
          quantity: 30
        };
        
        const response = await fetch(pharmacyPricesUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        endpointTests.pharmacyPrices.status = response.status;
        endpointTests.pharmacyPrices.url = pharmacyPricesUrl;
        
        if (response.ok) {
          const data = await response.json();
          endpointTests.pharmacyPrices.success = true;
          endpointTests.pharmacyPrices.data = `Data retrieved successfully for GSN ${gsn}`;
          console.log('Pharmacy Prices endpoint test successful');
        } else {
          const errorText = await response.text();
          console.error(`Pharmacy Prices endpoint test failed: ${response.status} ${response.statusText}`, errorText);
        }
      } catch (error) {
        console.error('Error testing Pharmacy Prices endpoint:', error);
      }
      
    } catch (error) {
      console.error('Error testing API endpoints:', error);
    }
  } else {
    console.log('Skipping API endpoint tests due to authentication failure');
  }
  
  // Return results
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    envVars: {
      apiUrl,
      authUrl,
      clientId: !!clientId,
      clientSecret: !!clientSecret,
      hqMapping,
      useMockDrugInfo,
      useMockPharmacyPrices,
      useMockDrugSearch,
      useRealApi,
      fallbackToMock,
      nodeEnv
    },
    tests: {
      authentication: {
        success: authResult.success,
        message: authResult.message,
        token: authResult.token
      },
      endpoints: endpointTests
    }
  }, { headers: corsHeaders });
} 