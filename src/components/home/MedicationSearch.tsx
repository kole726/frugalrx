"use client"
import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

interface MedicationSearchProps {
  value: string
  onChange: (value: string) => void
}

export default function MedicationSearch({ value, onChange }: MedicationSearchProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.length >= 3) {
      // For now, let's use mock data until we have API access
      const mockSuggestions = [
        `${value} 10mg`,
        `${value} 20mg`,
        `${value} 40mg`,
        `${value} Extended Release`,
      ]
      setSuggestions(mockSuggestions)
    } else {
      setSuggestions([])
    }
  }, [value])

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
    <div ref={wrapperRef} className="relative flex-1">
      <div className="flex items-center bg-white rounded-full shadow-lg p-2">
        <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 ml-3" />
        <input
          type="text"
          placeholder="Enter medication name..."
          className="flex-1 px-4 py-3 focus:outline-none text-lg rounded-full text-gray-900 placeholder:text-gray-400"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-50">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 text-gray-900"
              onClick={() => {
                onChange(suggestion)
                setShowSuggestions(false)
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 