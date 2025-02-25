'use client'
import { useEffect, useState } from 'react'
import { getDrugPrices } from '@/services/medicationApi'
import DrugInfo from '@/components/search/DrugInfo'
import LoadingState from '@/components/search/LoadingState'
import { DrugInfo as DrugInfoType } from '@/types/api'

interface Props {
  params: {
    name: string
  }
}

export default function DrugPage({ params }: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drugInfo, setDrugInfo] = useState<DrugInfoType | null>(null)

  useEffect(() => {
    const fetchDrugData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const drugName = decodeURIComponent(params.name)
        // Using mock coordinates for now - we'll add location later
        const data = await getDrugPrices({
          drugName,
          latitude: 30.4015,
          longitude: -97.7527,
          radius: 10,
          hqMappingName: 'walkerrx'
        })

        setDrugInfo(data.drug)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDrugData()
  }, [params.name])

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
            {drugInfo.brandName || drugInfo.genericName}
          </h1>
          <DrugInfo info={drugInfo} />
        </>
      )}
    </div>
  )
} 