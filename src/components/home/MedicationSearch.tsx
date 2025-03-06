"use client"
import { useState, useEffect, useRef, useCallback } from 'react'
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { useDebounce } from '@/hooks/useDebounce'

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
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  
  const debouncedSearch = useDebounce(searchTerm, 300)

  // Function to fetch suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([])
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      console.log('Searching for:', query);
      
      // Use the API endpoint that matches America's Pharmacy's documented endpoints
      const response = await fetch(`/api/drugautocomplete/${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store'
      });
      
      // Check if we're getting demo data
      const isUsingDemoData = response.headers.get('X-Data-Source') === 'mock';
      const warningMessage = response.headers.get('X-Warning');
      
      if (isUsingDemoData) {
        console.warn('Using demo data:', warningMessage);
        // Set a warning message but don't block the results
        setError('Note: Showing demo data. Some medications may not be available.');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching suggestions: ${response.status}`, errorText);
        throw new Error(`Error fetching suggestions: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Autocomplete results:', data);
      
      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from API');
      }
      
      // Format the suggestions
      const formattedSuggestions = data.map(item => ({
        drugName: item.label || item.value,
        gsn: item.gsn
      }));
      
      setSuggestions(formattedSuggestions);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setError('Unable to fetch medications. Please try again later.');
      setSuggestions([]);
      setIsLoading(false);
    }
  }, []);

  // Fetch suggestions when debounced search term changes
  useEffect(() => {
    if (debouncedSearch.length >= 3) { // Match America's Pharmacy minLength: 3
      fetchSuggestions(debouncedSearch)
    } else {
      setSuggestions([])
    }
  }, [debouncedSearch, fetchSuggestions])

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

  // Scroll active suggestion into view
  useEffect(() => {
    if (activeIndex >= 0 && suggestionsRef.current) {
      const activeElement = suggestionsRef.current.querySelector(`li:nth-child(${activeIndex + 1})`) as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    // Arrow down
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    }
    // Arrow up
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    }
    // Enter
    else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeIndex]);
    }
    // Escape
    else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: DrugSuggestion) => {
    console.log('Selected suggestion:', suggestion);
    
    // Update the search term with the selected drug name
    setSearchTerm(suggestion.drugName);
    
    // Close the suggestions dropdown
    setShowSuggestions(false);
    
    // Reset active index
    setActiveIndex(-1);
    
    // Call the onChange callback with the selected drug name and GSN if available
    onChange(suggestion.drugName, suggestion.gsn);
    
    // If onSearch is not provided, handle navigation directly
    if (!onSearch && typeof window !== 'undefined') {
      // Always convert drug name to lowercase and format for URLs
      const formattedDrugName = suggestion.drugName
        .toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, ''); // Remove special characters
      
      // Construct URL with GSN if available (important for API calls)
      const url = suggestion.gsn 
        ? `/drug/${encodeURIComponent(formattedDrugName)}?gsn=${suggestion.gsn}`
        : `/drug/${encodeURIComponent(formattedDrugName)}`;
      
      window.location.href = url;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={onSearch} className="bg-white rounded-full shadow-lg p-2 flex flex-row items-center">
        <div className="flex items-center flex-1 min-w-0">
          <MagnifyingGlassIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 ml-2 sm:ml-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Enter medication name..."
            className="flex-1 px-2 sm:px-4 py-2 sm:py-3 focus:outline-none text-sm sm:text-xl text-gray-900 font-medium w-full min-w-0 truncate"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowSuggestions(true)
              setActiveIndex(-1)
              onChange(e.target.value)
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            required
          />
        </div>
        {onSearch && (
          <button 
            type="submit"
            className="bg-accent hover:bg-accent/90 text-white px-3 sm:px-8 py-2 sm:py-3 rounded-full font-semibold sm:ml-2 flex-shrink-0 text-sm sm:text-base whitespace-nowrap"
          >
            Search
          </button>
        )}
      </form>

      {showSuggestions && searchTerm && searchTerm.length >= 3 && (
        <div 
          ref={suggestionsRef}
          className="absolute w-full mt-2 bg-white rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-3 sm:p-4 text-center text-gray-500 text-sm sm:text-base">Loading...</div>
          ) : suggestions.length > 0 ? (
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className={`px-3 sm:px-6 py-2 sm:py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                    index === activeIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div className="flex items-start">
                    <span className="text-sm sm:text-lg text-gray-900 font-medium">
                      {suggestion.drugName}
                    </span>
                    {suggestion.gsn && (
                      <span className="ml-2 text-xs text-gray-500">
                        GSN: {suggestion.gsn}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : error ? (
            <div className="p-3 sm:p-4 text-center text-red-500 text-sm sm:text-base">{error}</div>
          ) : (
            <div className="p-3 sm:p-4 text-center text-gray-500 text-sm sm:text-base">No medications found</div>
          )}
        </div>
      )}
    </div>
  )
} 