import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Mock data to use when API fails
const MOCK_DRUG_DATA = {
  amoxicillin: {
    brandName: "Amoxil",
    genericName: "Amoxicillin",
    description: "Amoxicillin is a penicillin antibiotic that fights bacteria.",
    sideEffects: "Common side effects include nausea, vomiting, diarrhea.",
    dosage: "250mg, 500mg, 875mg tablets or capsules",
    storage: "Store at room temperature away from moisture, heat, and light.",
    contraindications: "Do not use if you are allergic to penicillin antibiotics."
  },
  lisinopril: {
    brandName: "Prinivil, Zestril",
    genericName: "Lisinopril",
    description: "Lisinopril is an ACE inhibitor that is used to treat high blood pressure.",
    sideEffects: "Common side effects include headache, dizziness, cough, and low blood pressure.",
    dosage: "5mg, 10mg, 20mg, 40mg tablets",
    storage: "Store at room temperature away from moisture and heat.",
    contraindications: "Do not use if you are pregnant or have a history of angioedema."
  },
  atorvastatin: {
    brandName: "Lipitor",
    genericName: "Atorvastatin",
    description: "Atorvastatin is used to lower blood levels of \"bad\" cholesterol.",
    sideEffects: "Common side effects include joint pain, diarrhea, urinary tract infections.",
    dosage: "10mg, 20mg, 40mg, 80mg tablets",
    storage: "Store at room temperature away from moisture and heat.",
    contraindications: "Do not use if you have liver disease or if you are pregnant."
  }
};

export async function GET(request: Request) {
  // Get the drug name from the URL query parameter
  const url = new URL(request.url);
  const drugName = url.searchParams.get('drug') || 'amoxicillin';
  
  // Find the drug in our mock data
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
  
  // Return the mock drug data
  return NextResponse.json({
    success: true,
    data: mockDrug,
    message: 'Mock drug data retrieved successfully'
  });
} 