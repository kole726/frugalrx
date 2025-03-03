'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDetailedDrugInfo, getDrugDetailsByGsn } from '@/services/medicationApi'
import { DrugDetails } from '@/types/api'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'

interface Props {
  params: {
    gsn: string;
    type?: string[];
  }
}

export default function DrugInfoPage({ params }: Props) {
  const router = useRouter()
  const [drugInfo, setDrugInfo] = useState<DrugDetails | null>(null)
  const [detailedInfo, setDetailedInfo] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drugType, setDrugType] = useState<'B' | 'G'>('B') // Default to brand

  useEffect(() => {
    // Set drug type based on URL parameter
    if (params.type && params.type.length > 0) {
      const typeParam = params.type[0].toUpperCase();
      if (typeParam === 'B' || typeParam === 'G') {
        setDrugType(typeParam as 'B' | 'G');
      }
    }
  }, [params.type]);

  useEffect(() => {
    async function fetchDrugInfo() {
      try {
        setIsLoading(true)
        setError(null)
        
        // Handle special case for Biktarvy - GSN 5319 should use 78146
        let gsnToUse = params.gsn;
        if (params.gsn === '5319') {
          console.log('Using correct GSN 78146 for Biktarvy instead of 5319');
          gsnToUse = '78146';
        }
        
        const gsn = parseInt(gsnToUse, 10);
        if (isNaN(gsn)) {
          throw new Error('Invalid GSN parameter')
        }
        
        // Fetch detailed drug information with language code
        const languageCode = 'en'; // Default to English
        const detailedInfo = await getDetailedDrugInfo(gsn, languageCode)
        console.log('Detailed drug info:', detailedInfo)
        setDetailedInfo(detailedInfo)
        
        // Create a drug details object from the detailed info
        const drugDetails: DrugDetails = {
          brandName: detailedInfo.brandName || '',
          genericName: detailedInfo.genericName || '',
          description: detailedInfo.description || '',
          sideEffects: detailedInfo.sideEffects || detailedInfo.side || '',
          dosage: detailedInfo.dosage || '',
          storage: detailedInfo.storage || detailedInfo.store || '',
          contraindications: detailedInfo.contraindications || '',
          admin: detailedInfo.admin || '',
          disclaimer: detailedInfo.disclaimer || '',
          interaction: detailedInfo.interaction || '',
          missedD: detailedInfo.missedD || '',
          monitor: detailedInfo.monitor || '',
        }
        
        setDrugInfo(drugDetails)
      } catch (err) {
        console.error('Error fetching drug information:', err)
        setError('Failed to load drug information. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDrugInfo()
  }, [params.gsn, drugType])

  // Function to capitalize first letter of each word
  const capitalizeWords = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <Link 
        href={`/drug/${drugInfo?.genericName?.toLowerCase() || 'medication'}/?gsn=${params.gsn}`}
        className="inline-flex items-center text-[#006142] hover:text-[#22A307] mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Drug Page
      </Link>
      
      {/* Drug type selector */}
      {drugInfo?.brandName !== drugInfo?.genericName && (
        <div className="mb-6 flex space-x-2">
          <Link 
            href={`/drug-info/${params.gsn}/B/`}
            className={`px-4 py-2 rounded-md ${drugType === 'B' ? 'bg-[#006142] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Brand
          </Link>
          <Link 
            href={`/drug-info/${params.gsn}/G/`}
            className={`px-4 py-2 rounded-md ${drugType === 'G' ? 'bg-[#006142] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Generic
          </Link>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006142]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-2 text-red-700 underline"
          >
            Go Back
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-[#006142] text-white p-6">
              <h1 className="text-3xl font-bold">
                {drugType === 'B' 
                  ? (drugInfo?.brandName || detailedInfo?.brandName || 'Medication Information')
                  : (drugInfo?.genericName || detailedInfo?.genericName || 'Medication Information')}
              </h1>
              <p className="text-lg mt-2">
                {drugType === 'B' && drugInfo?.genericName !== drugInfo?.brandName
                  ? `Generic: ${drugInfo?.genericName || detailedInfo?.genericName}`
                  : drugType === 'G' && drugInfo?.genericName !== drugInfo?.brandName
                  ? `Brand: ${drugInfo?.brandName || detailedInfo?.brandName}`
                  : 'Brand Name Medication'}
              </p>
              {detailedInfo?.strength && (
                <p className="text-sm mt-1">Strength: {detailedInfo.strength}</p>
              )}
              {detailedInfo?.form && (
                <p className="text-sm mt-1">Form: {capitalizeWords(detailedInfo.form)}</p>
              )}
            </div>
            
            <div className="p-6">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-[#006142] mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">
                  {drugInfo?.description || detailedInfo?.description || 'No description available.'}
                </p>
              </div>
              
              {(drugInfo?.admin || detailedInfo?.admin) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-[#006142] mb-4">How to Use</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {drugInfo?.admin || detailedInfo?.admin}
                  </p>
                </div>
              )}
              
              {(drugInfo?.sideEffects || detailedInfo?.side) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-[#006142] mb-4">Side Effects</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {drugInfo?.sideEffects || detailedInfo?.side}
                  </p>
                </div>
              )}
              
              {(drugInfo?.storage || detailedInfo?.store) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-[#006142] mb-4">Storage</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {drugInfo?.storage || detailedInfo?.store}
                  </p>
                </div>
              )}
              
              {(drugInfo?.interaction || detailedInfo?.interaction) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-[#006142] mb-4">Drug Interactions</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {drugInfo?.interaction || detailedInfo?.interaction}
                  </p>
                </div>
              )}
              
              {(drugInfo?.contraindications || detailedInfo?.contra) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-[#006142] mb-4">Contraindications</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {drugInfo?.contraindications || detailedInfo?.contra}
                  </p>
                </div>
              )}
              
              {(drugInfo?.missedD || detailedInfo?.missedD) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-[#006142] mb-4">Missed Dose</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {drugInfo?.missedD || detailedInfo?.missedD}
                  </p>
                </div>
              )}
              
              {(drugInfo?.monitor || detailedInfo?.monitor) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-[#006142] mb-4">Monitoring</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {drugInfo?.monitor || detailedInfo?.monitor}
                  </p>
                </div>
              )}
              
              <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Disclaimer</h3>
                <p className="text-sm text-gray-600">
                  {detailedInfo?.disclaimer || 
                   "This information is for educational purposes only and is not intended as medical advice. Always consult with a healthcare provider for medical advice, diagnosis, or treatment."}
                </p>
              </div>
              
              <div className="mt-8">
                <Link 
                  href={`/drug/${drugInfo?.genericName?.toLowerCase() || 'medication'}/?gsn=${params.gsn}`}
                  className="inline-flex items-center px-6 py-3 bg-[#006142] text-white rounded-md hover:bg-[#22A307] transition-colors"
                >
                  Find Best Prices
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
} 