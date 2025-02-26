"use client"
import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { useDebounce } from '@/hooks/useDebounce'

interface Props {
  value: string
  onChange: (value: string) => void
}

interface DrugSuggestion {
  drugName: string;
  gsn: number;
  ndcCode: number;
  brandGenericFlag: string;
}

export default function MedicationSearch({ value, onChange }: Props) {
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
        const response = await fetch(`/api/drugs/search/${encodeURIComponent(debouncedSearch)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        // The API returns an array of drug names
        setSuggestions(data.map((name: string) => ({ drugName: name })));
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

  return (
    <div ref={wrapperRef} className="relative">
      <div className="bg-white rounded-full shadow-lg p-2 flex items-center">
        <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 ml-3" />
        <input
          type="text"
          placeholder="Enter medication name..."
          className="flex-1 px-4 py-3 focus:outline-none text-xl text-gray-900 font-medium rounded-full"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          required
        />
      </div>

      {showSuggestions && searchTerm && searchTerm.length > 1 && (
        <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 text-lg">Loading...</div>
          ) : suggestions.length > 0 ? (
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="px-6 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => {
                    setSearchTerm(suggestion.drugName)
                    onChange(suggestion.drugName)
                    setShowSuggestions(false)
                  }}
                >
                  <div className="flex items-start">
                    <span className="text-lg text-gray-900 font-medium">
                      {suggestion.drugName}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500 text-lg">No medications found</div>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 text-center text-red-500 text-lg">{error}</div>
      )}
    </div>
  )
} 