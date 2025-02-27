import { NextResponse } from 'next/server';
import { getDrugInfoByName } from '@/lib/server/medicationService';

// Mock data for fallback
const MOCK_DRUG_DATA = {
  amoxicillin: {
    brandName: "Amoxil",
    genericName: "Amoxicillin",
    description: "Amoxicillin is a penicillin antibiotic that fights bacteria. It is used to treat many different types of infection caused by bacteria, such as tonsillitis, bronchitis, pneumonia, and infections of the ear, nose, throat, skin, or urinary tract.",
    sideEffects: "Common side effects include nausea, vomiting, diarrhea, stomach pain, headache, rash, and allergic reactions.",
    dosage: "250mg, 500mg, 875mg tablets or capsules",
    storage: "Store at room temperature away from moisture, heat, and light.",
    contraindications: "Do not use if you are allergic to penicillin antibiotics."
  },
  lisinopril: {
    brandName: "Prinivil, Zestril",
    genericName: "Lisinopril",
    description: "Lisinopril is an ACE inhibitor that is used to treat high blood pressure (hypertension) in adults and children who are at least 6 years old. It is also used to treat heart failure in adults, or to improve survival after a heart attack.",
    sideEffects: "Common side effects include headache, dizziness, cough, and low blood pressure.",
    dosage: "5mg, 10mg, 20mg, 40mg tablets",
    storage: "Store at room temperature away from moisture and heat.",
    contraindications: "Do not use if you are pregnant or have a history of angioedema."
  },
  atorvastatin: {
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
    // Get the drug name from the URL query parameter
    const url = new URL(request.url);
    const drugName = url.searchParams.get('name');
    
    if (!drugName) {
      console.error('API: Missing drug name parameter');
      return NextResponse.json(
        { error: 'Drug name is required' },
        { status: 400 }
      );
    }
    
    try {
      // Try to get real data from the API
      console.log(`API: Getting drug info for: ${drugName}`);
      const drugInfo = await getDrugInfoByName(drugName);
      
      // Log the drug info we're returning
      console.log(`API: Returning drug info for ${drugName}:`, drugInfo);
      
      // Ensure all fields are present
      const completeInfo = {
        brandName: drugInfo.brandName || drugName,
        genericName: drugInfo.genericName || drugName,
        description: drugInfo.description || `${drugName} is a medication used to treat various conditions. Please consult with your healthcare provider for specific information.`,
        sideEffects: drugInfo.sideEffects || "Side effects may vary. Please consult with your healthcare provider for detailed information.",
        dosage: drugInfo.dosage || "Various strengths available",
        storage: drugInfo.storage || "Store according to package instructions.",
        contraindications: drugInfo.contraindications || "Please consult with your healthcare provider for contraindication information."
      };
      
      console.log(`API: Returning complete drug info for ${drugName}:`, completeInfo);
      return NextResponse.json(completeInfo);
    } catch (apiError) {
      console.error('API: Error fetching drug info, falling back to mock data:', apiError);
      
      // Fall back to mock data if API fails
      const drugNameLower = drugName.toLowerCase();
      let mockDrug = null;
      
      if (drugNameLower.includes('amoxicillin')) {
        mockDrug = MOCK_DRUG_DATA.amoxicillin;
      } else if (drugNameLower.includes('lisinopril')) {
        mockDrug = MOCK_DRUG_DATA.lisinopril;
      } else if (drugNameLower.includes('atorvastatin') || drugNameLower.includes('lipitor')) {
        mockDrug = MOCK_DRUG_DATA.atorvastatin;
      } else {
        // Create a generic mock drug based on the name
        const formattedName = drugName.charAt(0).toUpperCase() + drugName.slice(1).toLowerCase();
        console.log(`API: Creating generic mock drug for ${formattedName}`);
        mockDrug = {
          brandName: formattedName,
          genericName: formattedName,
          description: `${formattedName} is a medication used to treat various conditions. Please consult with your healthcare provider for specific information.`,
          sideEffects: "Side effects may vary. Please consult with your healthcare provider for detailed information.",
          dosage: "Various strengths available",
          storage: "Store according to package instructions.",
          contraindications: "Please consult with your healthcare provider for contraindication information."
        };
      }
      
      console.log(`API: Returning mock drug info for ${drugName}:`, mockDrug);
      return NextResponse.json(mockDrug);
    }
  } catch (error) {
    console.error('Error in drug info API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 