'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { searchMedication } from '@/services/medicationApi'
import SearchResults from '@/components/medication/SearchResults'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const medication = searchParams.get('medication')
    const location = searchParams.get('location')

    if (medication && location) {
      setLoading(true)
      setError(null)

      // Use America's Pharmacy search endpoint
      fetch(`https://www.americaspharmacy.com/api/drug/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drug: medication,
          location: location,
          radius: 10 // miles
        })
      })
        .then(res => res.json())
        .then(data => {
          setResults(data.prices || [])
          setLoading(false)
        })
        .catch(err => {
          setError('Failed to fetch results')
          setLoading(false)
        })
    }
  }, [searchParams])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-dark mb-4">Error</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  return <SearchResults results={results} />
} 