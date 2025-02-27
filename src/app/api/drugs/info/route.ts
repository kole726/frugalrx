import { NextResponse } from 'next/server';
import { MOCK_DRUG_DATA } from '@/lib/mockData';

export async function GET(request: Request) {
  try {
    // Get the drug name from the URL query parameter
    const url = new URL(request.url);
    const drugName = url.searchParams.get('name');
    
    if (!drugName) {
      return NextResponse.json(
        { error: 'Drug name is required' },
        { status: 400 }
      );
    }
    
    // For now, we'll just return mock data
    // In a real app, this would call the actual API
    const drugNameLower = drugName.toLowerCase();
    let mockDrug = null;
    
    if (drugNameLower.includes('amoxicillin')) {
      mockDrug = MOCK_DRUG_DATA.amoxicillin;
    } else if (drugNameLower.includes('lisinopril')) {
      mockDrug = MOCK_DRUG_DATA.lisinopril;
    } else if (drugNameLower.includes('atorvastatin') || drugNameLower.includes('lipitor')) {
      mockDrug = MOCK_DRUG_DATA.atorvastatin;
    } else {
      // Use amoxicillin as default mock data
      mockDrug = MOCK_DRUG_DATA.amoxicillin;
    }
    
    return NextResponse.json(mockDrug);
  } catch (error) {
    console.error('Error in drug info API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 