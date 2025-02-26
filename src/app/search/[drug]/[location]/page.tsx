'use client'
import { useEffect, useState } from 'react'
import { getDrugPrices, getDrugInfo } from '@/services/medicationApi'
import PharmacyList from '@/components/search/PharmacyList'
import DrugInfo from '@/components/search/DrugInfo'
import SearchFilters from '@/components/search/SearchFilters'
import LoadingState from '@/components/search/LoadingState'
import { DrugInfo as DrugInfoType, PharmacyPrice, APIError, DrugPriceRequest } from '@/types/api'

interface Props {
  params: {
    drug: string
    location: string
  }
}

export default function DrugSearchPage({ params }: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drugInfo, setDrugInfo] = useState<DrugInfoType | null>(null)
  const [pharmacyPrices, setPharmacyPrices] = useState<PharmacyPrice[]>([])
  const [filters, setFilters] = useState({
    radius: 10,
    sortBy: 'price',
    chainOnly: false,
  })

  useEffect(() => {
    const fetchDrugData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const coords = await getCoordinatesFromZip(decodeURIComponent(params.location))
        const drugName = decodeURIComponent(params.drug)

        const prices = await getDrugPrices({
          drugName: drugName,
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius: filters.radius,
          hqMappingName: 'walkerrx',
          maximumPharmacies: 50
        } as DrugPriceRequest)

        setPharmacyPrices(prices.pharmacies || [])

        // Try to get drug info by name
        try {
          const info = await getDrugInfo(drugName)
          if (info) {
            const drugInfoData: DrugInfoType = {
              brandName: info.brandName,
              genericName: info.genericName,
              gsn: 0, // Placeholder since we don't have GSN
              ndcCode: '', // Placeholder since we don't have NDC
              description: info.description,
              sideEffects: info.sideEffects,
              dosage: info.dosage,
              storage: info.storage,
              contraindications: info.contraindications,
              prices: prices.pharmacies
            }
            setDrugInfo(drugInfoData)
          }
        } catch (infoError) {
          console.warn('Could not fetch drug info:', infoError)
        }
      } catch (error: unknown) {
        const apiError = error as APIError;
        setError(apiError.message || 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDrugData()
  }, [params.drug, params.location, filters.radius])

  if (isLoading) return <LoadingState />
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {decodeURIComponent(params.drug)} Prices Near {decodeURIComponent(params.location)}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Sidebar */}
        <div className="lg:col-span-1">
          <SearchFilters 
            filters={filters} 
            onChange={setFilters} 
          />
          {drugInfo && <DrugInfo info={drugInfo} />}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <PharmacyList 
            pharmacies={pharmacyPrices}
            sortBy={filters.sortBy}
            chainOnly={filters.chainOnly}
          />
        </div>
      </div>
    </div>
  )
}

async function getCoordinatesFromZip(_zipCode: string) {
  return {
    latitude: 37.7749,
    longitude: -122.4194
  }
} 