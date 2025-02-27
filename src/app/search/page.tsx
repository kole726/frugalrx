'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { searchMedications } from '@/services/medicationApi'
import MedicationSearchResults from '@/components/medication/MedicationSearchResults'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<Array<{ drugName: string; gsn?: number }>>([])
  const languageCode = searchParams.get('lang') || 'en'

  useEffect(() => {
    const query = searchParams.get('q')
    if (query) {
      setSearchQuery(query)
      handleSearch(query)
    }
  }, [searchParams])

  const handleSearch = async (query: string) => {
    if (!query.trim()) return

    try {
      setIsLoading(true)
      setError(null)
      
      const searchResults = await searchMedications(query)
      setResults(searchResults)
    } catch (err) {
      console.error('Error searching medications:', err)
      setError('Failed to search medications. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(searchQuery)
    
    // Update URL with search query
    const url = new URL(window.location.href)
    url.searchParams.set('q', searchQuery)
    window.history.pushState({}, '', url.toString())
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Medications</h1>
        
        <form onSubmit={handleSubmit} className="flex w-full max-w-3xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter medication name..."
            className="flex-grow px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-r-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <MedicationSearchResults 
          results={results} 
          isLoading={isLoading} 
          languageCode={languageCode}
        />
      )}
    </div>
  )
} 