"use client"
import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { useDebounce } from '@/hooks/useDebounce'
import { searchMedications } from '@/services/medicationApi'

interface Props {
  value: string
  onChange: (value: string, gsn?: number) => void
  onSearch?: (e: React.FormEvent) => void
}

interface DrugSuggestion {
  drugName: string;
  gsn?: number;
}

export default function MedicationSearch({ value, onChange, onSearch }: Props) {
  const [searchTerm, setSearchTerm] = useState(value)
  const [suggestions, setSuggestions] = useState<DrugSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  
  const debouncedSearch = useDebounce(searchTerm, 300)

  useEffect(() => {
    async function fetchSuggestions() {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        setSuggestions([])
        setError(null)
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        console.log('Searching for:', debouncedSearch);
        
        // Always use our API route
        const results = await searchMedications(debouncedSearch);
        
        // Format drug names with proper capitalization (first letter uppercase, rest lowercase)
        const formattedResults = results.map(result => ({
          ...result,
          drugName: result.drugName.charAt(0).toUpperCase() + result.drugName.slice(1).toLowerCase()
        }));
        
        setSuggestions(formattedResults);
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setError('Failed to fetch medications. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedSearch])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSuggestionClick = (suggestion: DrugSuggestion) => {
    // Display the drug name with proper capitalization in the search box
    setSearchTerm(suggestion.drugName)
    // Pass the properly formatted name to the parent component, but ensure GSN is preserved
    onChange(suggestion.drugName, suggestion.gsn)
    setShowSuggestions(false)
    
    // If onSearch is not provided, handle navigation directly
    if (!onSearch && typeof window !== 'undefined') {
      // Always convert drug name to lowercase for URLs
      const normalizedDrugName = suggestion.drugName.toLowerCase()
      
      const url = suggestion.gsn 
        ? `/medications/${encodeURIComponent(normalizedDrugName)}?gsn=${suggestion.gsn}`
        : `/medications/${encodeURIComponent(normalizedDrugName)}`;
      window.location.href = url;
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={onSearch} className="bg-white rounded-full shadow-lg p-2 flex flex-row items-center">
        <div className="flex items-center flex-1 min-w-0">
          <MagnifyingGlassIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 ml-2 sm:ml-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Enter medication name..."
            className="flex-1 px-2 sm:px-4 py-2 sm:py-3 focus:outline-none text-sm sm:text-xl text-gray-900 font-medium w-full min-w-0 truncate"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowSuggestions(true)
              onChange(e.target.value)
            }}
            onFocus={() => setShowSuggestions(true)}
            required
          />
        </div>
        {onSearch && (
          <button 
            type="submit"
            className="bg-[#FF6B8B] hover:bg-[#FF6B8B]/90 text-white px-3 sm:px-8 py-2 sm:py-3 rounded-full font-semibold sm:ml-2 flex-shrink-0 text-sm sm:text-base whitespace-nowrap"
          >
            Search
          </button>
        )}
      </form>

      {showSuggestions && searchTerm && searchTerm.length > 1 && (
        <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 sm:p-4 text-center text-gray-500 text-sm sm:text-base">Loading...</div>
          ) : suggestions.length > 0 ? (
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="px-3 sm:px-6 py-2 sm:py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-start">
                    <span className="text-sm sm:text-lg text-gray-900 font-medium">
                      {suggestion.drugName}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 sm:p-4 text-center text-gray-500 text-sm sm:text-base">No medications found</div>
          )}
        </div>
      )}

      {error && (
        <div className="p-2 sm:p-4 text-center text-red-500 text-sm sm:text-base">{error}</div>
      )}
    </div>
  )
} 