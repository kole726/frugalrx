import { NextResponse } from 'next/server';
import { MOCK_DRUG_DATA } from '@/lib/mockData';

export async function GET(request: Request) {
  try {
    // Get the GSN from the URL query parameter
    const url = new URL(request.url);
    const gsn = url.searchParams.get('gsn');
    
    if (!gsn) {
      return NextResponse.json(
        { error: 'GSN is required' },
        { status: 400 }
      );
    }
    
    // For now, we'll just return mock data
    // In a real app, this would call the actual API with the GSN
    // For simplicity, we'll just return amoxicillin data
    return NextResponse.json(MOCK_DRUG_DATA.amoxicillin);
  } catch (error) {
    console.error('Error in drug details API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 