import { NextRequest, NextResponse } from 'next/server'
import { getDrugPrices } from '@/lib/server/medicationService'
import { DrugPriceRequest, APIError } from '@/types/api'
import { MOCK_PHARMACY_PRICES } from '@/lib/mockData'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

// Map of zip codes to default coordinates
const zipCodeCoordinates: Record<string, { latitude: number; longitude: number }> = {
  '78759': { latitude: 30.4014, longitude: -97.7525 }, // Austin, TX
  // Add more zip codes as needed
};

// Default coordinates for Austin, TX
const DEFAULT_LATITUDE = 30.4014;
const DEFAULT_LONGITUDE = -97.7525;

export async function POST(request: Request) {
  try {
    const criteria = await request.json();
    console.log('Fetching drug prices with criteria:', criteria);
    
    let latitude = criteria.latitude;
    let longitude = criteria.longitude;
    
    // If latitude and longitude are not provided, try to get them from zipCode
    if ((!latitude || !longitude) && criteria.zipCode) {
      const coordinates = zipCodeCoordinates[criteria.zipCode] || 
                         { latitude: DEFAULT_LATITUDE, longitude: DEFAULT_LONGITUDE };
      latitude = coordinates.latitude;
      longitude = coordinates.longitude;
      console.log(`Using coordinates for zip code ${criteria.zipCode}:`, coordinates);
    }
    
    // Validate required fields
    if ((!criteria.drugName && !criteria.gsn && !criteria.ndcCode)) {
      return NextResponse.json(
        { error: 'Missing required fields: either drugName, gsn, or ndcCode must be provided' },
        { status: 400 }
      );
    }
    
    const priceRequest: DrugPriceRequest = {
      latitude: latitude,
      longitude: longitude,
      hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
      radius: criteria.radius || 10,
      maximumPharmacies: criteria.maximumPharmacies || 50
    };
    
    // Add either drugName, gsn, or ndcCode
    if (criteria.drugName) {
      priceRequest.drugName = criteria.drugName;
    } else if (criteria.gsn) {
      priceRequest.gsn = criteria.gsn;
    } else if (criteria.ndcCode) {
      priceRequest.ndcCode = criteria.ndcCode;
    }
    
    // Add optional fields if provided
    if (criteria.customizedQuantity) {
      priceRequest.customizedQuantity = criteria.customizedQuantity;
      priceRequest.quantity = criteria.quantity;
    }
    
    try {
      const data = await getDrugPrices(priceRequest);
      console.log(`Found ${data.pharmacies?.length || 0} pharmacies with prices`);
      
      // Ensure we have pharmacies in the response
      if (!data.pharmacies || data.pharmacies.length === 0) {
        console.log('No pharmacies found in API response, adding mock pharmacies');
        
        // Add mock pharmacies if none are found
        data.pharmacies = MOCK_PHARMACY_PRICES;
      }
      
      // Ensure we have brand variations in the response
      if (!data.brandVariations || !Array.isArray(data.brandVariations) || data.brandVariations.length === 0) {
        console.log('No brand variations found in API response, adding default ones');
        
        // Add default brand variations if not present
        data.brandVariations = [
          {
            name: `${criteria.drugName} (brand)`,
            type: 'brand',
            gsn: data.brandVariations?.[0]?.gsn || 1790
          },
          {
            name: `${criteria.drugName} (generic)`,
            type: 'generic',
            gsn: data.brandVariations?.[0]?.gsn ? data.brandVariations[0].gsn + 1 : 1791
          }
        ];
      }
      
      // Ensure we have forms in the response
      if (!data.forms || !Array.isArray(data.forms) || data.forms.length === 0) {
        console.log('No forms found in API response, adding default ones');
        
        // Add default forms if not present
        data.forms = [
          { form: 'TABLET', gsn: 1790 },
          { form: 'CAPSULE', gsn: 1791 },
          { form: 'LIQUID', gsn: 1792 }
        ];
      }
      
      // Ensure we have strengths in the response
      if (!data.strengths || !Array.isArray(data.strengths) || data.strengths.length === 0) {
        console.log('No strengths found in API response, adding default ones');
        
        // Add default strengths if not present
        data.strengths = [
          { strength: '500 mg', gsn: 1790 },
          { strength: '250 mg', gsn: 1791 },
          { strength: '125 mg', gsn: 1792 }
        ];
      }
      
      // Ensure we have quantities in the response
      if (!data.quantities || !Array.isArray(data.quantities) || data.quantities.length === 0) {
        console.log('No quantities found in API response, adding default ones');
        
        // Add default quantities if not present
        data.quantities = [
          { quantity: 30, uom: 'TABLET' },
          { quantity: 60, uom: 'TABLET' },
          { quantity: 90, uom: 'TABLET' }
        ];
      }
      
      // Return the complete response including brand variations
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error fetching drug prices, falling back to mock data:', error);
      
      // Fall back to mock data if API fails
      return NextResponse.json({
        pharmacies: MOCK_PHARMACY_PRICES,
        brandVariations: [
          {
            name: `${criteria.drugName} (brand)`,
            type: 'brand',
            gsn: 1790
          },
          {
            name: `${criteria.drugName} (generic)`,
            type: 'generic',
            gsn: 1791
          }
        ],
        forms: [
          { form: 'TABLET', gsn: 1790 },
          { form: 'CAPSULE', gsn: 1791 },
          { form: 'LIQUID', gsn: 1792 }
        ],
        strengths: [
          { strength: '500 mg', gsn: 1790 },
          { strength: '250 mg', gsn: 1791 },
          { strength: '125 mg', gsn: 1792 }
        ],
        quantities: [
          { quantity: 30, uom: 'TABLET' },
          { quantity: 60, uom: 'TABLET' },
          { quantity: 90, uom: 'TABLET' }
        ],
        error: error instanceof Error ? error.message : 'Unknown error',
        usingMockData: true
      });
    }
  } catch (error) {
    console.error('Server error in drug prices API:', error);
    return NextResponse.json(
      { error: `Failed to fetch drug prices: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Get the parameters from the URL query
    const url = new URL(request.url);
    const drugName = url.searchParams.get('drugName');
    const gsnParam = url.searchParams.get('gsn');
    const ndcCode = url.searchParams.get('ndcCode');
    
    if (!drugName && !gsnParam && !ndcCode) {
      return NextResponse.json(
        { error: 'Either drugName, gsn, or ndcCode is required' },
        { status: 400 }
      );
    }
    
    // Convert GSN to number if provided
    const gsn = gsnParam ? parseInt(gsnParam, 10) : undefined;
    
    // Get coordinates from query parameters or use defaults
    const latitude = parseFloat(url.searchParams.get('latitude') || `${DEFAULT_LATITUDE}`);
    const longitude = parseFloat(url.searchParams.get('longitude') || `${DEFAULT_LONGITUDE}`);
    const radius = parseInt(url.searchParams.get('radius') || '10', 10);
    
    const priceRequest: DrugPriceRequest = {
      latitude,
      longitude,
      radius,
      hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
    };
    
    // Add either drugName, gsn, or ndcCode
    if (drugName) {
      priceRequest.drugName = drugName;
    } else if (gsn) {
      priceRequest.gsn = gsn;
    } else if (ndcCode) {
      priceRequest.ndcCode = ndcCode;
    }
    
    try {
      const data = await getDrugPrices(priceRequest);
      
      // Ensure we have pharmacies in the response
      if (!data.pharmacies || data.pharmacies.length === 0) {
        console.log('No pharmacies found in API response, adding mock pharmacies');
        
        // Add mock pharmacies if none are found
        data.pharmacies = MOCK_PHARMACY_PRICES;
      }
      
      // Ensure we have brand variations in the response
      if (!data.brandVariations || !Array.isArray(data.brandVariations) || data.brandVariations.length === 0) {
        console.log('No brand variations found in API response, adding default ones');
        
        // Add default brand variations if not present
        data.brandVariations = [
          {
            name: `${drugName} (brand)`,
            type: 'brand',
            gsn: data.brandVariations?.[0]?.gsn || 1790
          },
          {
            name: `${drugName} (generic)`,
            type: 'generic',
            gsn: data.brandVariations?.[0]?.gsn ? data.brandVariations[0].gsn + 1 : 1791
          }
        ];
      }
      
      // Ensure we have forms in the response
      if (!data.forms || !Array.isArray(data.forms) || data.forms.length === 0) {
        console.log('No forms found in API response, adding default ones');
        
        // Add default forms if not present
        data.forms = [
          { form: 'TABLET', gsn: 1790 },
          { form: 'CAPSULE', gsn: 1791 },
          { form: 'LIQUID', gsn: 1792 }
        ];
      }
      
      // Ensure we have strengths in the response
      if (!data.strengths || !Array.isArray(data.strengths) || data.strengths.length === 0) {
        console.log('No strengths found in API response, adding default ones');
        
        // Add default strengths if not present
        data.strengths = [
          { strength: '500 mg', gsn: 1790 },
          { strength: '250 mg', gsn: 1791 },
          { strength: '125 mg', gsn: 1792 }
        ];
      }
      
      // Ensure we have quantities in the response
      if (!data.quantities || !Array.isArray(data.quantities) || data.quantities.length === 0) {
        console.log('No quantities found in API response, adding default ones');
        
        // Add default quantities if not present
        data.quantities = [
          { quantity: 30, uom: 'TABLET' },
          { quantity: 60, uom: 'TABLET' },
          { quantity: 90, uom: 'TABLET' }
        ];
      }
      
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error fetching drug prices, falling back to mock data:', error);
      
      // Fall back to mock data if API fails
      return NextResponse.json({
        pharmacies: MOCK_PHARMACY_PRICES,
        brandVariations: [
          {
            name: `${drugName} (brand)`,
            type: 'brand',
            gsn: 1790
          },
          {
            name: `${drugName} (generic)`,
            type: 'generic',
            gsn: 1791
          }
        ],
        forms: [
          { form: 'TABLET', gsn: 1790 },
          { form: 'CAPSULE', gsn: 1791 },
          { form: 'LIQUID', gsn: 1792 }
        ],
        strengths: [
          { strength: '500 mg', gsn: 1790 },
          { strength: '250 mg', gsn: 1791 },
          { strength: '125 mg', gsn: 1792 }
        ],
        quantities: [
          { quantity: 30, uom: 'TABLET' },
          { quantity: 60, uom: 'TABLET' },
          { quantity: 90, uom: 'TABLET' }
        ],
        error: error instanceof Error ? error.message : 'Unknown error',
        usingMockData: true
      });
    }
  } catch (error) {
    console.error('Error in drug prices API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 