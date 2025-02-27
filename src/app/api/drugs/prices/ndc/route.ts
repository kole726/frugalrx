import { NextRequest, NextResponse } from 'next/server';
import { getDrugPrices } from '@/lib/server/medicationService';
import { DrugPriceRequest } from '@/types/api';

/**
 * API endpoint to get drug prices by NDC code
 * POST /api/drugs/prices/ndc
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    const { ndcCode, latitude, longitude } = body;
    
    if (!ndcCode) {
      return NextResponse.json(
        { error: 'Missing required parameter: ndcCode' },
        { status: 400 }
      );
    }
    
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required parameters: latitude and longitude' },
        { status: 400 }
      );
    }
    
    // Prepare the request for the medication service
    const priceRequest: DrugPriceRequest = {
      ndcCode: ndcCode,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius: body.radius ? parseFloat(body.radius) : undefined,
      maximumPharmacies: body.maximumPharmacies ? parseInt(body.maximumPharmacies) : undefined,
      customizedQuantity: body.customizedQuantity,
      quantity: body.quantity ? parseInt(body.quantity) : undefined
    };
    
    console.log(`Fetching drug prices by NDC code: ${ndcCode}`);
    const prices = await getDrugPrices(priceRequest);
    
    return NextResponse.json(prices);
  } catch (error) {
    console.error('Error in drug prices by NDC API:', error);
    return NextResponse.json(
      { error: `Failed to fetch drug prices: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 