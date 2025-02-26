import { NextResponse } from 'next/server'
import { getDrugPrices } from '@/lib/server/medicationService'
import { DrugPriceRequest } from '@/types/api'

interface APIError extends Error {
  status?: number;
}

export async function POST(request: Request) {
  try {
    const criteria = await request.json();
    console.log('Fetching drug prices with criteria:', criteria);
    
    // Validate required fields
    if (!criteria.drugName || !criteria.latitude || !criteria.longitude) {
      return NextResponse.json(
        { error: 'Missing required fields: drugName, latitude, or longitude' },
        { status: 400 }
      );
    }
    
    const priceRequest: DrugPriceRequest = {
      drugName: criteria.drugName,
      latitude: criteria.latitude,
      longitude: criteria.longitude,
      radius: criteria.radius || 10,
      hqMappingName: criteria.hqMappingName || 'walkerrx',
      maximumPharmacies: criteria.maximumPharmacies || 50
    };
    
    const data = await getDrugPrices(priceRequest);
    console.log('Drug Prices Response:', data);
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    const apiError = error as APIError;
    console.error('Server Error:', apiError);
    return NextResponse.json(
      { error: apiError.message || 'Failed to fetch prices' },
      { status: 500 }
    );
  }
} 