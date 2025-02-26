'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getDrugDetailsByGsn, getDrugInfo, getDrugPrices } from '@/services/medicationApi'
import DrugInfo from '@/components/search/DrugInfo'
import LoadingState from '@/components/search/LoadingState'
import { DrugInfo as DrugInfoType, DrugDetails, PharmacyPrice, APIError } from '@/types/api'

interface Props {
  params: {
    name: string
  }
}

export default function DrugPage({ params }: Props) {
  const searchParams = useSearchParams()
  const gsn = searchParams.get('gsn')
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drugInfo, setDrugInfo] = useState<DrugInfoType | null>(null)
  const [drugDetails, setDrugDetails] = useState<DrugDetails | null>(null)
  const [pharmacyPrices, setPharmacyPrices] = useState<PharmacyPrice[]>([])

  useEffect(() => {
    const fetchDrugData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const drugName = decodeURIComponent(params.name)
        
        // If we have a GSN, fetch drug details directly
        if (gsn) {
          const details = await getDrugDetailsByGsn(parseInt(gsn, 10))
          setDrugDetails(details)
          
          // Create a basic drug info object from the details
          setDrugInfo({
            brandName: details.brandName,
            genericName: details.genericName,
            gsn: parseInt(gsn, 10),
            ndcCode: '',
            description: details.description,
            sideEffects: details.sideEffects,
            strength: details.dosage,
            storage: details.storage,
            manufacturer: details.contraindications
          })
        } else {
          // Otherwise, search for the drug by name
          const info = await getDrugInfo(drugName)
          setDrugDetails(info)
          
          // Create a basic drug info object from the details
          setDrugInfo({
            brandName: info.brandName,
            genericName: info.genericName,
            gsn: 0, // We don't have a GSN in this case
            ndcCode: '',
            description: info.description,
            sideEffects: info.sideEffects,
            strength: info.dosage,
            storage: info.storage,
            manufacturer: info.contraindications
          })
        }

        // Fetch pharmacy prices
        // Using default coordinates for Austin, TX
        const pricesResponse = await getDrugPrices({
          drugName,
          latitude: 30.4015,
          longitude: -97.7527,
          radius: 10
        })

        if (pricesResponse && pricesResponse.pharmacies) {
          setPharmacyPrices(pricesResponse.pharmacies)
          
          // Update drug info with prices
          setDrugInfo(prevInfo => {
            if (!prevInfo) return null
            return {
              ...prevInfo,
              prices: pricesResponse.pharmacies
            }
          })
        }
      } catch (error: unknown) {
        const apiError = error as APIError;
        setError(apiError.message || 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDrugData()
  }, [params.name, gsn])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Drug Information</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-4 text-red-700 hover:text-red-800 font-medium"
          >
            ← Back to Search
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-8">
            {drugInfo?.brandName || drugInfo?.genericName}
          </h1>
          {drugInfo && <DrugInfo info={drugInfo} />}
        </>
      )}
    </div>
  )
} 