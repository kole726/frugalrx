import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { getDrugPrices } from '@/lib/server/medicationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.latitude || !body.longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Validate that at least one drug identifier is provided
    if (!body.gsn && !body.drugName) {
      return NextResponse.json(
        { error: 'At least one of gsn or drugName must be provided' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Convert string numbers to actual numbers if needed
    const requestData = {
      ...body,
      latitude: typeof body.latitude === 'string' ? parseFloat(body.latitude) : body.latitude,
      longitude: typeof body.longitude === 'string' ? parseFloat(body.longitude) : body.longitude,
      radius: body.radius ? (typeof body.radius === 'string' ? parseFloat(body.radius) : body.radius) : undefined,
      gsn: body.gsn ? (typeof body.gsn === 'string' ? parseInt(body.gsn, 10) : body.gsn) : undefined,
      // Add a flag to indicate we want grouped results
      groupByPharmacyChain: true
    };
    
    const result = await getDrugPrices(requestData);
    
    // Process the result to group pharmacies by chain
    const groupedResult = {
      ...result,
      groupedPharmacies: groupPharmaciesByChain(result.pharmacies || [])
    };
    
    return NextResponse.json(groupedResult, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in group pharmacy drug pricing API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Helper function to group pharmacies by chain
function groupPharmaciesByChain(pharmacies: any[]) {
  const grouped: Record<string, any[]> = {};
  
  pharmacies.forEach(pharmacy => {
    const chainName = pharmacy.chainName || pharmacy.name.split(' ')[0] || 'Other';
    
    if (!grouped[chainName]) {
      grouped[chainName] = [];
    }
    
    grouped[chainName].push(pharmacy);
  });
  
  return Object.entries(grouped).map(([chainName, pharmacies]) => ({
    chainName,
    pharmacyCount: pharmacies.length,
    lowestPrice: Math.min(...pharmacies.map((p: any) => parseFloat(p.price) || 0)),
    highestPrice: Math.max(...pharmacies.map((p: any) => parseFloat(p.price) || 0)),
    pharmacies
  }));
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 