import { NextRequest, NextResponse } from 'next/server';
import { DrugInfo, PharmacyPrice } from '@/types/api';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

/**
 * API endpoint to get alternative medications (generics or therapeutic alternatives)
 * POST /api/drugs/alternatives
 * 
 * Request body:
 * {
 *   drugName: "medication_name",
 *   latitude: 30.4014,
 *   longitude: -97.7525,
 *   includeGenerics: true,
 *   includeTherapeutic: false
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    const { drugName, latitude, longitude } = body;
    
    if (!drugName) {
      return NextResponse.json(
        { error: 'Missing required parameter: drugName' },
        { status: 400 }
      );
    }
    
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required parameters: latitude and longitude' },
        { status: 400 }
      );
    }
    
    const includeGenerics = body.includeGenerics !== false; // Default to true
    const includeTherapeutic = body.includeTherapeutic === true; // Default to false
    
    // In a real implementation, this would call an API service
    // For now, we'll generate mock data
    console.log(`Finding alternatives for ${drugName} near: ${latitude}, ${longitude}`);
    
    const alternatives: Array<DrugInfo & { prices: PharmacyPrice[] }> = [];
    
    // Create a mock generic alternative
    if (includeGenerics) {
      const genericName = drugName.toLowerCase();
      alternatives.push({
        brandName: `Generic ${drugName}`,
        genericName: genericName,
        gsn: 12345, // Mock GSN
        ndcCode: 'NDC-12345',
        description: `Generic version of ${drugName}`,
        sideEffects: `Similar side effects to ${drugName}`,
        dosage: `Same dosage as ${drugName}`,
        storage: `Store at room temperature`,
        contraindications: `Similar contraindications to ${drugName}`,
        prices: [
          { name: "Walgreens", price: 8.99, distance: "0.8 miles" },
          { name: "CVS Pharmacy", price: 9.50, distance: "1.2 miles" },
          { name: "Walmart Pharmacy", price: 6.99, distance: "2.5 miles" },
          { name: "Rite Aid", price: 10.75, distance: "3.1 miles" },
          { name: "Target Pharmacy", price: 7.25, distance: "4.0 miles" }
        ]
      });
    }
    
    // Create a mock therapeutic alternative
    if (includeTherapeutic) {
      alternatives.push({
        brandName: `Alternative to ${drugName}`,
        genericName: `therapeutic-alt-${drugName.toLowerCase()}`,
        gsn: 67890, // Mock GSN
        ndcCode: 'NDC-67890',
        description: `Therapeutic alternative to ${drugName}`,
        sideEffects: `Different side effect profile than ${drugName}`,
        dosage: `Dosage may differ from ${drugName}`,
        storage: `Store at room temperature`,
        contraindications: `May have different contraindications than ${drugName}`,
        prices: [
          { name: "Walgreens", price: 10.99, distance: "0.8 miles" },
          { name: "CVS Pharmacy", price: 11.50, distance: "1.2 miles" },
          { name: "Walmart Pharmacy", price: 8.99, distance: "2.5 miles" },
          { name: "Rite Aid", price: 12.75, distance: "3.1 miles" },
          { name: "Target Pharmacy", price: 9.25, distance: "4.0 miles" }
        ]
      });
    }
    
    return NextResponse.json(alternatives);
  } catch (error) {
    console.error('Error in medication alternatives API:', error);
    return NextResponse.json(
      { error: `Failed to fetch medication alternatives: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 