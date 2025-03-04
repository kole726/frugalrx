import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { compareMedications } from '@/lib/server/medicationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.gsns || !Array.isArray(body.gsns) || body.gsns.length === 0) {
      return NextResponse.json(
        { error: 'GSNs array is required and must not be empty' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (!body.latitude || !body.longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Convert string numbers to actual numbers if needed
    const latitude = typeof body.latitude === 'string' ? parseFloat(body.latitude) : body.latitude;
    const longitude = typeof body.longitude === 'string' ? parseFloat(body.longitude) : body.longitude;
    const radius = body.radius ? (typeof body.radius === 'string' ? parseFloat(body.radius) : body.radius) : undefined;
    
    // Format medications array for the compareMedications function
    const medications = body.gsns.map((gsn: number | string) => ({
      gsn: typeof gsn === 'string' ? parseInt(gsn, 10) : gsn
    }));
    
    const result = await compareMedications(medications, latitude, longitude, radius);
    
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in multi-drug prices by GSN API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 