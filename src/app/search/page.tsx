'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getDrugPrices, getDrugInfo } from '@/services/medicationApi'
import PharmacyList from '@/components/search/PharmacyList'
import DrugInfo from '@/components/search/DrugInfo'
import SearchFilters from '@/components/search/SearchFilters'
import LoadingState from '@/components/search/LoadingState'
import { DrugInfo as DrugInfoType, DrugPrice, APIError, DrugPriceRequest } from '@/types/api'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drugInfo, setDrugInfo] = useState<DrugInfoType | null>(null)
  const [pharmacyPrices, setPharmacyPrices] = useState<DrugPrice[]>([])
  const [filters, setFilters] = useState({
    radius: 10,
    sortBy: 'price',
    chainOnly: false,
  })

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const medication = searchParams.get('medication')
        const location = searchParams.get('location')

        if (!medication || !location) {
          throw new Error('Missing search parameters')
        }

        const coords = await getCoordinatesFromZip(location)

        const prices = await getDrugPrices({
          drugName: medication,
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius: filters.radius,
          hqMappingName: 'walkerrx',
          maximumPharmacies: 50
        } as DrugPriceRequest)

        setPharmacyPrices(prices.pharmacyPrices || [])

        if (prices.drug?.gsn) {
          const info = await getDrugInfo(prices.drug.gsn)
          setDrugInfo(info)
        }
      } catch (error: unknown) {
        const apiError = error as APIError;
        setError(apiError.message || 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [searchParams, filters.radius])

  if (isLoading) return <LoadingState />
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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