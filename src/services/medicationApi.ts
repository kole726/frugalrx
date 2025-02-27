import { DrugInfo, DrugDetails, PharmacyPrice, DrugPriceResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

interface DrugSearchResponse {
  drugName: string;
  gsn?: number;
}

interface DrugPriceRequest {
  drugName: string;
  latitude: number;
  longitude: number;
  radius?: number;
  hqMappingName?: string;
  maximumPharmacies?: number;
}

/**
 * Search for medications by name
 * @param query The search query
 * @returns A list of matching medications
 */
export async function searchMedications(query: string): Promise<DrugSearchResponse[]> {
  try {
    // Convert query to lowercase before encoding to ensure consistent URL format
    const normalizedQuery = query.toLowerCase();
    console.log(`Client: Searching for medications with query: "${normalizedQuery}"`);
    
    const response = await fetch(`${API_BASE_URL}/drugs/search/${encodeURIComponent(normalizedQuery)}`);
    
    if (!response.ok) {
      let errorMessage = `Failed to fetch medications: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If we can't parse the error as JSON, use the status code
        console.error('Could not parse error response as JSON:', e);
      }
      
      console.error(`Client: API error when searching for "${normalizedQuery}":`, errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`Client: Found ${data.length} results for "${normalizedQuery}"`);
    
    // Process the drug names to ensure proper capitalization
    // The API returns drug names in ALL CAPS, so we need to format them properly
    const formattedResults = Array.isArray(data) ? data.map(item => {
      // If the item is a string, convert it to an object with drugName property
      const drugItem = typeof item === 'string' 
        ? { drugName: item } 
        : item;
      
      // Format the drug name with proper capitalization
      // First letter uppercase, rest lowercase
      if (drugItem.drugName) {
        drugItem.drugName = drugItem.drugName.charAt(0).toUpperCase() + 
                           drugItem.drugName.slice(1).toLowerCase();
      }
      
      return drugItem;
    }) : data;
    
    return formattedResults;
  } catch (error) {
    console.error('Client: Error searching medications:', error);
    throw error;
  }
}

/**
 * Get prices for a medication at nearby pharmacies
 * @param criteria The search criteria
 * @returns Price information for the medication
 */
export async function getDrugPrices(criteria: DrugPriceRequest): Promise<DrugPriceResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/drugs/prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(criteria),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch drug prices: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching drug prices:', error);
    throw error;
  }
}

/**
 * Get detailed information about a medication by GSN
 * @param gsn The GSN (Generic Sequence Number) of the medication
 * @returns Detailed information about the medication
 */
export async function getDrugDetailsByGsn(gsn: number): Promise<DrugDetails> {
  try {
    const response = await fetch(`${API_BASE_URL}/drugs/info/${gsn}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch drug details: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching drug details:', error);
    throw error;
  }
}

/**
 * Get detailed information about a medication by name
 * @param drugName The name of the medication
 * @returns Detailed information about the medication
 */
export async function getDrugInfo(drugName: string): Promise<DrugDetails> {
  try {
    // Normalize drug name to lowercase for API requests
    const normalizedDrugName = drugName.toLowerCase();
    console.log(`Client: Getting drug info for: "${normalizedDrugName}"`);
    
    // Try to get real data from API
    const response = await fetch(`${API_BASE_URL}/drugs/info?name=${encodeURIComponent(normalizedDrugName)}`);
    
    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If we can't parse the error as JSON, use the status code
        console.error('Could not parse error response as JSON:', e);
      }
      
      console.error(`Client: API error when getting info for "${normalizedDrugName}":`, errorMessage);
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log(`Client: Received drug info for "${normalizedDrugName}":`, data);
    
    // Format drug names with proper capitalization
    if (data) {
      if (data.genericName) {
        data.genericName = data.genericName.charAt(0).toUpperCase() + data.genericName.slice(1).toLowerCase();
      }
      if (data.brandName) {
        // Brand names may have multiple words, so capitalize each word
        data.brandName = data.brandName.split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
    }
    
    // Ensure all required fields are present with proper formatting
    const formattedData: DrugDetails = {
      brandName: data.brandName || drugName.charAt(0).toUpperCase() + drugName.slice(1).toLowerCase(),
      genericName: data.genericName || drugName.charAt(0).toUpperCase() + drugName.slice(1).toLowerCase(),
      description: data.description || `${drugName.charAt(0).toUpperCase() + drugName.slice(1).toLowerCase()} is a medication used to treat various conditions. Please consult with your healthcare provider for specific information.`,
      sideEffects: data.sideEffects || "Side effects may vary. Please consult with your healthcare provider for detailed information.",
      dosage: data.dosage || "Various strengths available",
      storage: data.storage || "Store according to package instructions.",
      contraindications: data.contraindications || "Please consult with your healthcare provider for contraindication information."
    };
    
    console.log(`Client: Successfully processed drug info for "${normalizedDrugName}"`);
    return formattedData;
  } catch (error) {
    console.error('Client: Error fetching drug info, using mock data:', error);
    
    // Fall back to mock data
    const drugNameLower = drugName.toLowerCase();
    
    if (drugNameLower.includes('amoxicillin')) {
      return MOCK_DRUG_DATA.amoxicillin;
    } else if (drugNameLower.includes('lisinopril')) {
      return MOCK_DRUG_DATA.lisinopril;
    } else if (drugNameLower.includes('atorvastatin') || drugNameLower.includes('lipitor')) {
      return MOCK_DRUG_DATA.atorvastatin;
    }
    
    // Create a generic drug info object based on the drug name instead of defaulting to amoxicillin
    const formattedName = drugName.charAt(0).toUpperCase() + drugName.slice(1).toLowerCase();
    console.log(`Client: Creating generic drug info for "${formattedName}"`);
    
    return {
      brandName: formattedName,
      genericName: formattedName,
      description: `${formattedName} is a medication used to treat various conditions. Please consult with your healthcare provider for specific information.`,
      sideEffects: "Side effects may vary. Please consult with your healthcare provider for detailed information.",
      dosage: "Various strengths available",
      storage: "Store according to package instructions.",
      contraindications: "Please consult with your healthcare provider for contraindication information."
    };
  }
}

/**
 * Test the API connection
 * @returns true if the connection is successful, false otherwise
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/test-connection`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API Connection Test:', data);
    return data.status === 'connected';
  } catch (error) {
    console.error('API Connection Test Failed:', error);
    return false;
  }
}

/**
 * Get pharmacies near a specific ZIP code
 * @param zipCode The ZIP code to search near
 * @returns A list of pharmacies near the specified ZIP code
 */
export async function getPharmaciesByZipCode(zipCode: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/pharmacies?zipCode=${encodeURIComponent(zipCode)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch pharmacies: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    throw error;
  }
}

// Mock data to use when API fails
const MOCK_DRUG_DATA: Record<string, DrugDetails> = {
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

// Mock pharmacy prices
const MOCK_PHARMACY_PRICES: PharmacyPrice[] = [
  { name: "Walgreens", price: 12.99, distance: "0.8 miles" },
  { name: "CVS Pharmacy", price: 14.50, distance: "1.2 miles" },
  { name: "Walmart Pharmacy", price: 9.99, distance: "2.5 miles" },
  { name: "Rite Aid", price: 13.75, distance: "3.1 miles" },
  { name: "Target Pharmacy", price: 11.25, distance: "4.0 miles" }
]; 