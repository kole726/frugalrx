'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getDrugDetailsByGsn, getDrugInfo, getDrugPrices } from '@/services/medicationApi'
import DrugInfo from '@/components/search/DrugInfo'
import LoadingState from '@/components/search/LoadingState'
import { DrugInfo as DrugInfoType, DrugDetails, PharmacyPrice, APIError } from '@/types/api'
import Link from 'next/link'
import { MapPinIcon, ArrowLeftIcon, ShieldCheckIcon, BeakerIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import DrugInfoCard from '@/components/medication/DrugInfoCard'

// Mock data to use when API fails
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
  },
  vyvanse: {
    brandName: "Vyvanse",
    genericName: "Lisdexamfetamine",
    description: "Vyvanse (lisdexamfetamine) is a central nervous system stimulant used to treat attention deficit hyperactivity disorder (ADHD) in adults and children 6 years of age and older. It is also used to treat moderate to severe binge eating disorder in adults. Vyvanse is a federally controlled substance (CII) because it can be abused or lead to dependence.",
    sideEffects: "Common side effects include decreased appetite, insomnia, dry mouth, increased heart rate, anxiety, irritability, and weight loss. More serious side effects may include heart problems, psychiatric issues, circulation problems, and slowed growth in children.",
    dosage: "10mg, 20mg, 30mg, 40mg, 50mg, 60mg, 70mg capsules",
    storage: "Store at room temperature in a cool, dry place away from direct sunlight. Keep away from moisture and heat.",
    contraindications: "Do not use if you have heart problems, high blood pressure, hyperthyroidism, glaucoma, or if you are taking MAO inhibitors."
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

interface Props {
  params: {
    name: string
  }
}

export default function MedicationPage({ params }: Props) {
  const searchParams = useSearchParams()
  const gsn = searchParams.get('gsn')
  const languageCode = searchParams.get('lang') || 'en'
  const drugName = decodeURIComponent(params.name)
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{drugName}</h1>
      
      <div className="mb-8">
        <DrugInfoCard 
          drugName={drugName} 
          gsn={gsn ? parseInt(gsn, 10) : undefined} 
          languageCode={languageCode}
        />
      </div>
      
      <div className="mt-8">
        <a 
          href="/search" 
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Search
        </a>
      </div>
    </div>
  )
} 