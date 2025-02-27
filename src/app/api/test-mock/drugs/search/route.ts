import { NextResponse } from 'next/server'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

// Mock data for testing
const MOCK_DRUGS = [
  { drugName: 'Amoxicillin', gsn: 1234 },
  { drugName: 'Lisinopril', gsn: 2345 },
  { drugName: 'Atorvastatin', gsn: 3456 },
  { drugName: 'Metformin', gsn: 4567 },
  { drugName: 'Levothyroxine', gsn: 5678 },
  { drugName: 'Amlodipine', gsn: 6789 },
  { drugName: 'Metoprolol', gsn: 7890 },
  { drugName: 'Albuterol', gsn: 8901 },
  { drugName: 'Omeprazole', gsn: 9012 },
  { drugName: 'Losartan', gsn: 1023 },
  { drugName: 'Gabapentin', gsn: 2134 },
  { drugName: 'Hydrochlorothiazide', gsn: 3245 },
  { drugName: 'Sertraline', gsn: 4356 },
  { drugName: 'Simvastatin', gsn: 5467 },
  { drugName: 'Vyvanse', gsn: 6578 },
  { drugName: 'Triamcinolone', gsn: 7689 },
  { drugName: 'Trimethoprim', gsn: 8790 },
  { drugName: 'Triamterene', gsn: 9801 },
  { drugName: 'Triptorelin', gsn: 1012 },
  { drugName: 'Trifluoperazine', gsn: 2123 }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    console.log('Mock search query:', query)

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const normalizedQuery = query.toLowerCase();
    const filteredDrugs = MOCK_DRUGS.filter(drug => 
      drug.drugName.toLowerCase().includes(normalizedQuery)
    );
    
    console.log(`Found ${filteredDrugs.length} mock drugs matching "${normalizedQuery}"`);
    return NextResponse.json(filteredDrugs);
  } catch (error) {
    console.error('Server error in mock drug search API:', error);
    return NextResponse.json(
      { error: `Failed to search drugs: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 