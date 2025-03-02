import { NextResponse } from 'next/server';
import { getDetailedDrugInfo } from '@/lib/server/medicationService';
import { DrugDetails, APIError } from '@/types/api';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// Mock drug data for fallback
const MOCK_DRUG_DATA: Record<number, DrugDetails> = {
  1234: {
    brandName: "Amoxil",
    genericName: "Amoxicillin",
    description: "Amoxicillin is a penicillin antibiotic that fights bacteria. It is used to treat many different types of infection caused by bacteria, such as tonsillitis, bronchitis, pneumonia, and infections of the ear, nose, throat, skin, or urinary tract.",
    sideEffects: "Common side effects include nausea, vomiting, diarrhea, stomach pain, headache, rash, and allergic reactions.",
    dosage: "250mg, 500mg, 875mg tablets or capsules",
    storage: "Store at room temperature away from moisture, heat, and light.",
    contraindications: "Do not use if you are allergic to penicillin antibiotics."
  },
  2345: {
    brandName: "Prinivil, Zestril",
    genericName: "Lisinopril",
    description: "Lisinopril is an ACE inhibitor that is used to treat high blood pressure (hypertension) in adults and children who are at least 6 years old. It is also used to treat heart failure in adults, or to improve survival after a heart attack.",
    sideEffects: "Common side effects include headache, dizziness, cough, and low blood pressure.",
    dosage: "5mg, 10mg, 20mg, 40mg tablets",
    storage: "Store at room temperature away from moisture and heat.",
    contraindications: "Do not use if you are pregnant or have a history of angioedema."
  },
  3456: {
    brandName: "Lipitor",
    genericName: "Atorvastatin",
    description: "Atorvastatin is used to lower blood levels of \"bad\" cholesterol (low-density lipoprotein, or LDL), to increase levels of \"good\" cholesterol (high-density lipoprotein, or HDL), and to lower triglycerides.",
    sideEffects: "Common side effects include joint pain, diarrhea, urinary tract infections, and muscle pain.",
    dosage: "10mg, 20mg, 40mg, 80mg tablets",
    storage: "Store at room temperature away from moisture and heat.",
    contraindications: "Do not use if you have liver disease or if you are pregnant."
  }
};

export async function GET(request: Request) {
  try {
    // Get the GSN from the URL query parameter
    const url = new URL(request.url);
    const gsnParam = url.searchParams.get('gsn');
    
    if (!gsnParam) {
      console.error('API: Missing GSN parameter');
      return NextResponse.json(
        { error: 'GSN is required' },
        { status: 400 }
      );
    }
    
    const gsn = parseInt(gsnParam, 10);
    
    if (isNaN(gsn)) {
      console.error('API: Invalid GSN parameter:', gsnParam);
      return NextResponse.json(
        { error: 'Invalid GSN parameter' },
        { status: 400 }
      );
    }
    
    try {
      // Try to get real data from the API
      console.log(`API: Getting detailed drug info for GSN: ${gsn}`);
      const drugInfo = await getDetailedDrugInfo(gsn);
      
      // Log the drug info we're returning
      console.log(`API: Returning detailed drug info for GSN ${gsn}:`, drugInfo);
      
      return NextResponse.json(drugInfo);
    } catch (apiError) {
      console.error('API: Error fetching detailed drug info, falling back to mock data:', apiError);
      
      // Check if we have specific mock data for this GSN
      if (MOCK_DRUG_DATA[gsn]) {
        console.log(`API: Using predefined mock data for GSN ${gsn}`);
        return NextResponse.json(MOCK_DRUG_DATA[gsn]);
      }
      
      // Fall back to generic mock data if API fails
      const mockDrug: DrugDetails = {
        brandName: `Medication ${gsn}`,
        genericName: `Generic Medication ${gsn}`,
        description: `This is a medication with GSN ${gsn}. Please consult with your healthcare provider for specific information.`,
        sideEffects: "Side effects may vary. Please consult with your healthcare provider for detailed information.",
        dosage: "Various strengths available",
        storage: "Store according to package instructions.",
        contraindications: "Please consult with your healthcare provider for contraindication information."
      };
      
      console.log(`API: Returning mock drug info for GSN ${gsn}:`, mockDrug);
      return NextResponse.json(mockDrug);
    }
  } catch (error) {
    console.error('Error in detailed drug info API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 