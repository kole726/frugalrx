import { DrugDetails, PharmacyPrice } from '@/types/api';

/**
 * Mock drug data for development and fallback when API is unavailable
 */
export const MOCK_DRUG_DATA: Record<string, DrugDetails> = {
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
  },
  vyvanse: {
    brandName: "Vyvanse",
    genericName: "Lisdexamfetamine",
    description: "Vyvanse (lisdexamfetamine) is a central nervous system stimulant used to treat attention deficit hyperactivity disorder (ADHD) in adults and children 6 years of age and older. It is also used to treat moderate to severe binge eating disorder in adults. Vyvanse is a federally controlled substance (CII) because it can be abused or lead to dependence.",
    sideEffects: "Common side effects include decreased appetite, insomnia, dry mouth, increased heart rate, anxiety, irritability, and weight loss. More serious side effects may include heart problems, psychiatric issues, circulation problems, and slowed growth in children.",
    dosage: "10mg, 20mg, 30mg, 40mg, 50mg, 60mg, 70mg capsules",
    storage: "Store at room temperature in a cool, dry place away from direct sunlight. Keep away from moisture and heat.",
    contraindications: "Do not use if you have heart problems, high blood pressure, hyperthyroidism, glaucoma, or if you are taking MAO inhibitors."
  },
  metformin: {
    brandName: "Glucophage",
    genericName: "Metformin",
    description: "Metformin is used to treat type 2 diabetes. It helps control blood sugar levels by improving the way your body handles insulin.",
    sideEffects: "Common side effects include nausea, vomiting, stomach upset, diarrhea, and metallic taste in the mouth.",
    dosage: "500mg, 850mg, 1000mg tablets",
    storage: "Store at room temperature away from moisture and heat.",
    contraindications: "Do not use if you have severe kidney disease or metabolic acidosis."
  },
  levothyroxine: {
    brandName: "Synthroid",
    genericName: "Levothyroxine",
    description: "Levothyroxine is used to treat hypothyroidism (low thyroid hormone). It replaces the hormone normally produced by the thyroid gland.",
    sideEffects: "Side effects may include headache, nervousness, irritability, and insomnia.",
    dosage: "25mcg, 50mcg, 75mcg, 88mcg, 100mcg, 112mcg, 125mcg, 137mcg, 150mcg, 175mcg, 200mcg, 300mcg tablets",
    storage: "Store at room temperature away from light and moisture.",
    contraindications: "Do not use if you have untreated adrenal gland problems or thyrotoxicosis."
  }
};

/**
 * Mock drug data by GSN for development and fallback when API is unavailable
 */
export const MOCK_DRUG_DATA_BY_GSN: Record<number, DrugDetails> = {
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
  },
  4567: {
    brandName: "Glucophage",
    genericName: "Metformin",
    description: "Metformin is used to treat type 2 diabetes. It helps control blood sugar levels by improving the way your body handles insulin.",
    sideEffects: "Common side effects include nausea, vomiting, stomach upset, diarrhea, and metallic taste in the mouth.",
    dosage: "500mg, 850mg, 1000mg tablets",
    storage: "Store at room temperature away from moisture and heat.",
    contraindications: "Do not use if you have severe kidney disease or metabolic acidosis."
  },
  5678: {
    brandName: "Synthroid",
    genericName: "Levothyroxine",
    description: "Levothyroxine is used to treat hypothyroidism (low thyroid hormone). It replaces the hormone normally produced by the thyroid gland.",
    sideEffects: "Side effects may include headache, nervousness, irritability, and insomnia.",
    dosage: "25mcg, 50mcg, 75mcg, 88mcg, 100mcg, 112mcg, 125mcg, 137mcg, 150mcg, 175mcg, 200mcg, 300mcg tablets",
    storage: "Store at room temperature away from light and moisture.",
    contraindications: "Do not use if you have untreated adrenal gland problems or thyrotoxicosis."
  },
  6578: {
    brandName: "Vyvanse",
    genericName: "Lisdexamfetamine",
    description: "Vyvanse (lisdexamfetamine) is a central nervous system stimulant used to treat attention deficit hyperactivity disorder (ADHD) in adults and children 6 years of age and older. It is also used to treat moderate to severe binge eating disorder in adults. Vyvanse is a federally controlled substance (CII) because it can be abused or lead to dependence.",
    sideEffects: "Common side effects include decreased appetite, insomnia, dry mouth, increased heart rate, anxiety, irritability, and weight loss. More serious side effects may include heart problems, psychiatric issues, circulation problems, and slowed growth in children.",
    dosage: "10mg, 20mg, 30mg, 40mg, 50mg, 60mg, 70mg capsules",
    storage: "Store at room temperature in a cool, dry place away from direct sunlight. Keep away from moisture and heat.",
    contraindications: "Do not use if you have heart problems, high blood pressure, hyperthyroidism, glaucoma, or if you are taking MAO inhibitors."
  }
};

/**
 * Mock pharmacy prices for development and fallback when API is unavailable
 */
export const MOCK_PHARMACY_PRICES: PharmacyPrice[] = [
  { name: "Walgreens", price: 12.99, distance: "0.8 miles" },
  { name: "CVS Pharmacy", price: 14.50, distance: "1.2 miles" },
  { name: "Walmart Pharmacy", price: 9.99, distance: "2.5 miles" },
  { name: "Rite Aid", price: 13.75, distance: "3.1 miles" },
  { name: "Target Pharmacy", price: 11.25, distance: "4.0 miles" }
];

/**
 * Mock drug search results for development and testing
 */
export const MOCK_DRUG_SEARCH_RESULTS = [
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
  { drugName: 'Trifluoperazine', gsn: 2123 },
  // Adding drugs that start with "adv" based on America's Pharmacy results
  { drugName: 'Advair Diskus', gsn: 3001 },
  { drugName: 'Advair HFA', gsn: 3002 },
  { drugName: 'Advance Plus Intermittent', gsn: 3003 },
  { drugName: 'Advanced Acne Spot Treatment', gsn: 3004 },
  { drugName: 'Advanced Acne Wash', gsn: 3005 },
  { drugName: 'Advanced Allergy Collect Kit', gsn: 3006 },
  { drugName: 'Advanced Antacid-Antigas', gsn: 3007 },
  { drugName: 'Advanced Antibacterial Bandage', gsn: 3008 },
  { drugName: 'Advanced Calcium', gsn: 3009 },
  // Adding more common medications
  { drugName: 'Adderall', gsn: 3010 },
  { drugName: 'Adderall XR', gsn: 3011 },
  { drugName: 'Advil', gsn: 3012 },
  { drugName: 'Adzenys XR-ODT', gsn: 3013 },
  { drugName: 'Allegra', gsn: 3014 },
  { drugName: 'Ambien', gsn: 3015 },
  { drugName: 'Amitriptyline', gsn: 3016 },
  { drugName: 'Amoxicillin-Clavulanate', gsn: 3017 },
  { drugName: 'Amphetamine Salt Combo', gsn: 3018 },
  { drugName: 'Atenolol', gsn: 3019 },
  { drugName: 'Azithromycin', gsn: 3020 },
  { drugName: 'Bupropion', gsn: 3021 },
  { drugName: 'Cephalexin', gsn: 3022 },
  { drugName: 'Ciprofloxacin', gsn: 3023 },
  { drugName: 'Citalopram', gsn: 3024 },
  { drugName: 'Clonazepam', gsn: 3025 },
  { drugName: 'Cyclobenzaprine', gsn: 3026 },
  { drugName: 'Duloxetine', gsn: 3027 },
  { drugName: 'Escitalopram', gsn: 3028 },
  { drugName: 'Fluoxetine', gsn: 3029 },
  { drugName: 'Ibuprofen', gsn: 3030 },
  { drugName: 'Lexapro', gsn: 3031 },
  { drugName: 'Loratadine', gsn: 3032 },
  { drugName: 'Meloxicam', gsn: 3033 },
  { drugName: 'Naproxen', gsn: 3034 },
  { drugName: 'Pantoprazole', gsn: 3035 },
  { drugName: 'Prednisone', gsn: 3036 },
  { drugName: 'Quetiapine', gsn: 3037 },
  { drugName: 'Trazodone', gsn: 3038 },
  { drugName: 'Xanax', gsn: 3039 },
  { drugName: 'Zoloft', gsn: 3040 }
];

/**
 * Get mock drug information for development and fallback
 * @param drugName The name of the medication (lowercase)
 * @returns Mock drug information
 */
export function getMockDrugInfo(drugName: string): DrugDetails {
  // Check if we have predefined mock data for this drug
  const normalizedDrugName = drugName.toLowerCase();
  
  // Return predefined mock data if available
  if (MOCK_DRUG_DATA[normalizedDrugName]) {
    console.log(`Using predefined mock data for ${normalizedDrugName}`);
    return MOCK_DRUG_DATA[normalizedDrugName];
  }
  
  // Generate generic mock data for any drug
  const formattedDrugName = drugName.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  console.log(`Generating generic mock data for ${normalizedDrugName}`);
  return {
    brandName: `Brand ${formattedDrugName}`,
    genericName: formattedDrugName,
    description: `${formattedDrugName} is a medication used to treat various conditions. Please consult with your healthcare provider for specific information.`,
    sideEffects: "Side effects may vary. Please consult with your healthcare provider for detailed information.",
    dosage: "Various strengths available",
    storage: "Store at room temperature away from moisture and heat.",
    contraindications: "Please consult with your healthcare provider for contraindication information."
  };
}

/**
 * Get mock drug information by GSN for development and fallback
 * @param gsn The Generic Sequence Number of the medication
 * @returns Mock drug information
 */
export function getMockDrugInfoByGsn(gsn: number): DrugDetails {
  // Check if we have predefined mock data for this GSN
  if (MOCK_DRUG_DATA_BY_GSN[gsn]) {
    console.log(`Using predefined mock data for GSN ${gsn}`);
    return MOCK_DRUG_DATA_BY_GSN[gsn];
  }
  
  // Generate generic mock data for any GSN
  console.log(`Generating generic mock data for GSN ${gsn}`);
  return {
    brandName: `Medication ${gsn}`,
    genericName: `Generic Medication ${gsn}`,
    description: `This is a medication with GSN ${gsn}. Please consult with your healthcare provider for specific information.`,
    sideEffects: "Side effects may vary. Please consult with your healthcare provider for detailed information.",
    dosage: "Various strengths available",
    storage: "Store according to package instructions.",
    contraindications: "Please consult with your healthcare provider for contraindication information."
  };
}

/**
 * Filter mock drug search results based on a query
 * @param query The search query
 * @returns Filtered mock drug search results
 */
export function getMockDrugSearchResults(query: string) {
  // Filter medications based on the query
  return MOCK_DRUG_SEARCH_RESULTS.filter(med => 
    med.drugName.toLowerCase().includes(query.toLowerCase())
  );
} 