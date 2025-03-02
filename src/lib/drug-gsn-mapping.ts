/**
 * This file contains mappings between drug names and their GSN (Generic Sequence Number)
 * These mappings can be used when the API doesn't provide GSNs directly
 */

interface DrugGsnMapping {
  brandName: string;
  genericName: string;
  gsn: number;
}

// Common medications and their GSNs
// These are based on real GSNs where possible, but some may be placeholders
export const DRUG_GSN_MAPPINGS: DrugGsnMapping[] = [
  { brandName: 'Lipitor', genericName: 'Atorvastatin', gsn: 62733 },
  { brandName: 'Crestor', genericName: 'Rosuvastatin', gsn: 75940 },
  { brandName: 'Zocor', genericName: 'Simvastatin', gsn: 70956 },
  { brandName: 'Pravachol', genericName: 'Pravastatin', gsn: 70954 },
  { brandName: 'Lisinopril', genericName: 'Lisinopril', gsn: 19675 },
  { brandName: 'Prinivil', genericName: 'Lisinopril', gsn: 19675 },
  { brandName: 'Zestril', genericName: 'Lisinopril', gsn: 19675 },
  { brandName: 'Norvasc', genericName: 'Amlodipine', gsn: 19787 },
  { brandName: 'Toprol XL', genericName: 'Metoprolol Succinate', gsn: 19839 },
  { brandName: 'Lopressor', genericName: 'Metoprolol Tartrate', gsn: 19838 },
  { brandName: 'Tenormin', genericName: 'Atenolol', gsn: 19853 },
  { brandName: 'Coreg', genericName: 'Carvedilol', gsn: 21737 },
  { brandName: 'Diovan', genericName: 'Valsartan', gsn: 21162 },
  { brandName: 'Cozaar', genericName: 'Losartan', gsn: 21104 },
  { brandName: 'Benicar', genericName: 'Olmesartan', gsn: 72063 },
  { brandName: 'Micardis', genericName: 'Telmisartan', gsn: 21214 },
  { brandName: 'Avapro', genericName: 'Irbesartan', gsn: 21109 },
  { brandName: 'Atacand', genericName: 'Candesartan', gsn: 21107 },
  { brandName: 'Hyzaar', genericName: 'Losartan/HCTZ', gsn: 21105 },
  { brandName: 'Diovan HCT', genericName: 'Valsartan/HCTZ', gsn: 21163 },
  { brandName: 'Benicar HCT', genericName: 'Olmesartan/HCTZ', gsn: 72064 },
  { brandName: 'Micardis HCT', genericName: 'Telmisartan/HCTZ', gsn: 21215 },
  { brandName: 'Avalide', genericName: 'Irbesartan/HCTZ', gsn: 21110 },
  { brandName: 'Atacand HCT', genericName: 'Candesartan/HCTZ', gsn: 21108 },
  { brandName: 'Synthroid', genericName: 'Levothyroxine', gsn: 12560 },
  { brandName: 'Levoxyl', genericName: 'Levothyroxine', gsn: 12560 },
  { brandName: 'Unithroid', genericName: 'Levothyroxine', gsn: 12560 },
  { brandName: 'Cytomel', genericName: 'Liothyronine', gsn: 12565 },
  { brandName: 'Armour Thyroid', genericName: 'Thyroid', gsn: 12568 },
  { brandName: 'Metformin', genericName: 'Metformin', gsn: 17948 },
  { brandName: 'Glucophage', genericName: 'Metformin', gsn: 17948 },
  { brandName: 'Glucophage XR', genericName: 'Metformin ER', gsn: 17949 },
  { brandName: 'Januvia', genericName: 'Sitagliptin', gsn: 77185 },
  { brandName: 'Janumet', genericName: 'Sitagliptin/Metformin', gsn: 77186 },
  { brandName: 'Tradjenta', genericName: 'Linagliptin', gsn: 91536 },
  { brandName: 'Jentadueto', genericName: 'Linagliptin/Metformin', gsn: 91537 },
  { brandName: 'Onglyza', genericName: 'Saxagliptin', gsn: 84749 },
  { brandName: 'Kombiglyze XR', genericName: 'Saxagliptin/Metformin ER', gsn: 84750 },
  { brandName: 'Nesina', genericName: 'Alogliptin', gsn: 99267 },
  { brandName: 'Kazano', genericName: 'Alogliptin/Metformin', gsn: 99268 },
  { brandName: 'Oseni', genericName: 'Alogliptin/Pioglitazone', gsn: 99269 },
  { brandName: 'Actos', genericName: 'Pioglitazone', gsn: 21346 },
  { brandName: 'Avandia', genericName: 'Rosiglitazone', gsn: 21347 },
  { brandName: 'Amaryl', genericName: 'Glimepiride', gsn: 21344 },
  { brandName: 'Glucotrol', genericName: 'Glipizide', gsn: 17950 },
  { brandName: 'Glucotrol XL', genericName: 'Glipizide ER', gsn: 17951 },
  { brandName: 'DiaBeta', genericName: 'Glyburide', gsn: 17952 },
  { brandName: 'Micronase', genericName: 'Glyburide', gsn: 17952 },
  { brandName: 'Glynase', genericName: 'Glyburide Micronized', gsn: 17953 },
  { brandName: 'Amoxil', genericName: 'Amoxicillin', gsn: 1983 },
  { brandName: 'Augmentin', genericName: 'Amoxicillin/Clavulanate', gsn: 1984 },
  { brandName: 'Zithromax', genericName: 'Azithromycin', gsn: 3227 },
  { brandName: 'Biaxin', genericName: 'Clarithromycin', gsn: 3228 },
  { brandName: 'Keflex', genericName: 'Cephalexin', gsn: 2001 },
  { brandName: 'Cipro', genericName: 'Ciprofloxacin', gsn: 3542 },
  { brandName: 'Levaquin', genericName: 'Levofloxacin', gsn: 3544 },
  { brandName: 'Bactrim', genericName: 'Sulfamethoxazole/Trimethoprim', gsn: 8597 },
  { brandName: 'Septra', genericName: 'Sulfamethoxazole/Trimethoprim', gsn: 8597 },
  { brandName: 'Flagyl', genericName: 'Metronidazole', gsn: 4103 },
  { brandName: 'Diflucan', genericName: 'Fluconazole', gsn: 4133 },
  { brandName: 'Valtrex', genericName: 'Valacyclovir', gsn: 4139 },
  { brandName: 'Zovirax', genericName: 'Acyclovir', gsn: 4138 },
  { brandName: 'Tamiflu', genericName: 'Oseltamivir', gsn: 50635 },
  { brandName: 'Relenza', genericName: 'Zanamivir', gsn: 50636 },
  { brandName: 'Tylenol', genericName: 'Acetaminophen', gsn: 1790 },
  { brandName: 'Advil', genericName: 'Ibuprofen', gsn: 1780 },
  { brandName: 'Motrin', genericName: 'Ibuprofen', gsn: 1780 },
  { brandName: 'Aleve', genericName: 'Naproxen', gsn: 1782 },
  { brandName: 'Naprosyn', genericName: 'Naproxen', gsn: 1782 },
  { brandName: 'Celebrex', genericName: 'Celecoxib', gsn: 50420 },
  { brandName: 'Vyvanse', genericName: 'Lisdexamfetamine', gsn: 77288 },
  { brandName: 'Adderall', genericName: 'Amphetamine/Dextroamphetamine', gsn: 11819 },
  { brandName: 'Adderall XR', genericName: 'Amphetamine/Dextroamphetamine ER', gsn: 11820 },
  { brandName: 'Ritalin', genericName: 'Methylphenidate', gsn: 11830 },
  { brandName: 'Concerta', genericName: 'Methylphenidate ER', gsn: 11831 },
  { brandName: 'Strattera', genericName: 'Atomoxetine', gsn: 72122 },
  { brandName: 'Focalin', genericName: 'Dexmethylphenidate', gsn: 50690 },
  { brandName: 'Focalin XR', genericName: 'Dexmethylphenidate ER', gsn: 50691 },
];

/**
 * Find a GSN for a given drug name
 * @param drugName The brand or generic name of the drug
 * @returns The GSN if found, undefined otherwise
 */
export function findGsnByDrugName(drugName: string): number | undefined {
  const normalizedName = drugName.toLowerCase();
  
  const mapping = DRUG_GSN_MAPPINGS.find(
    mapping => 
      mapping.brandName.toLowerCase() === normalizedName || 
      mapping.genericName.toLowerCase() === normalizedName
  );
  
  return mapping?.gsn;
}

/**
 * Find drug information by GSN
 * @param gsn The GSN to look up
 * @returns The drug mapping if found, undefined otherwise
 */
export function findDrugByGsn(gsn: number): DrugGsnMapping | undefined {
  return DRUG_GSN_MAPPINGS.find(mapping => mapping.gsn === gsn);
} 