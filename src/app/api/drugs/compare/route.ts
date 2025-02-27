import { NextRequest, NextResponse } from 'next/server';
import { compareMedications } from '@/lib/server/medicationService';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

/**
 * API endpoint to compare multiple medications
 * POST /api/drugs/compare
 * 
 * Request body:
 * {
 *   medications: [
 *     { name: "medication1" },
 *     { gsn: 12345 }
 *   ],
 *   latitude: 30.4014,
 *   longitude: -97.7525,
 *   radius: 10
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    const { medications, latitude, longitude } = body;
    
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid required parameter: medications' },
        { status: 400 }
      );
    }
    
    // Validate that each medication has either a name or gsn
    const validMedications = medications.every(med => med.name || med.gsn);
    if (!validMedications) {
      return NextResponse.json(
        { error: 'Each medication must have either a name or gsn property' },
        { status: 400 }
      );
    }
    
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required parameters: latitude and longitude' },
        { status: 400 }
      );
    }
    
    // Get the comparison data
    console.log(`Comparing ${medications.length} medications near: ${latitude}, ${longitude}`);
    const comparisonData = await compareMedications(
      medications,
      parseFloat(latitude),
      parseFloat(longitude),
      body.radius ? parseFloat(body.radius) : undefined
    );
    
    return NextResponse.json(comparisonData);
  } catch (error) {
    console.error('Error in medication comparison API:', error);
    return NextResponse.json(
      { error: `Failed to compare medications: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 