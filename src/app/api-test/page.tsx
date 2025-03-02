"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ApiTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('lipitor')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  
  // New state for prefix search
  const [prefixQuery, setPrefixQuery] = useState('lip')
  const [prefixResults, setPrefixResults] = useState<any[]>([])
  const [isPrefixSearching, setIsPrefixSearching] = useState(false)
  const [prefixError, setPrefixError] = useState<string | null>(null)

  useEffect(() => {
    async function testConnection() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/test-connection')
        if (!response.ok) {
          throw new Error(`API test failed with status ${response.status}`)
        }
        const data = await response.json()
        setConnectionStatus(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    testConnection()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery || searchQuery.length < 3) {
      setSearchError('Search query must be at least 3 characters');
      return;
    }

    try {
      setIsSearching(true)
      setSearchError(null)
      const response = await fetch(`/api/drugs/search?q=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`)
      }
      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Unknown error')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }
  
  // New function to handle prefix search
  const handlePrefixSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prefixQuery || prefixQuery.length < 3) {
      setPrefixError('Prefix must be at least 3 characters');
      return;
    }

    try {
      setIsPrefixSearching(true)
      setPrefixError(null)
      const response = await fetch(`/api/drugs/prefix/${encodeURIComponent(prefixQuery)}`)
      if (!response.ok) {
        throw new Error(`Prefix search failed with status ${response.status}`)
      }
      const data = await response.json()
      setPrefixResults(data.results || [])
    } catch (err) {
      setPrefixError(err instanceof Error ? err.message : 'Unknown error')
      setPrefixResults([])
    } finally {
      setIsPrefixSearching(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">API Test Page</h1>
      
      <div className="mb-8">
        <Link href="/" className="text-blue-500 hover:underline">
          &larr; Back to Home
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">API Connection Status</h2>
        
        {isLoading ? (
          <div className="text-gray-500">Testing API connection...</div>
        ) : error ? (
          <div className="text-red-500">Error: {error}</div>
        ) : (
          <div>
            <div className="mb-2">
              <span className="font-medium">Status:</span>{' '}
              <span className={connectionStatus?.status === 'connected' ? 'text-green-500' : 'text-red-500'}>
                {connectionStatus?.status}
              </span>
            </div>
            
            <div className="mb-2">
              <span className="font-medium">Environment:</span> {connectionStatus?.environment}
            </div>
            
            <div className="mb-2">
              <span className="font-medium">Using Mock Data:</span>{' '}
              <span className={connectionStatus?.useMockData ? 'text-yellow-500' : 'text-green-500'}>
                {connectionStatus?.useMockData ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="mb-4">
              <span className="font-medium">Timestamp:</span> {connectionStatus?.timestamp}
            </div>
            
            <details className="mt-4">
              <summary className="cursor-pointer text-blue-500">Show Details</summary>
              <pre className="mt-2 bg-gray-100 p-4 rounded overflow-auto text-xs">
                {JSON.stringify(connectionStatus, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Drug Search (POST)</h2>
          
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter drug name"
                className="flex-1 border border-gray-300 rounded px-3 py-2"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
          
          {searchError && (
            <div className="text-red-500 mb-4">Error: {searchError}</div>
          )}
          
          {searchResults.length > 0 ? (
            <div>
              <h3 className="font-medium mb-2">Results ({searchResults.length}):</h3>
              <ul className="border rounded divide-y">
                {searchResults.map((result, index) => (
                  <li key={index} className="p-3 hover:bg-gray-50">
                    <div className="font-medium">{result.drugName}</div>
                    {result.gsn && <div className="text-sm text-gray-500">GSN: {result.gsn}</div>}
                  </li>
                ))}
              </ul>
            </div>
          ) : !isSearching && !searchError && searchQuery ? (
            <div className="text-gray-500">No results found</div>
          ) : null}
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Drug Search by Prefix (GET)</h2>
          
          <form onSubmit={handlePrefixSearch} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={prefixQuery}
                onChange={(e) => setPrefixQuery(e.target.value)}
                placeholder="Enter prefix (min 3 chars)"
                className="flex-1 border border-gray-300 rounded px-3 py-2"
              />
              <button
                type="submit"
                disabled={isPrefixSearching}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {isPrefixSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
          
          {prefixError && (
            <div className="text-red-500 mb-4">Error: {prefixError}</div>
          )}
          
          {prefixResults.length > 0 ? (
            <div>
              <h3 className="font-medium mb-2">Results ({prefixResults.length}):</h3>
              <ul className="border rounded divide-y">
                {prefixResults.map((result, index) => (
                  <li key={index} className="p-3 hover:bg-gray-50">
                    <div className="font-medium">{result.drugName}</div>
                    {result.gsn && <div className="text-sm text-gray-500">GSN: {result.gsn}</div>}
                  </li>
                ))}
              </ul>
            </div>
          ) : !isPrefixSearching && !prefixError && prefixQuery ? (
            <div className="text-gray-500">No results found</div>
          ) : null}
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">API Documentation</h2>
        
        <p className="mb-4">
          For a complete list of API endpoints and their implementation status, see the{' '}
          <Link href="/docs/api-endpoints" className="text-blue-500 hover:underline">
            API Endpoints Documentation
          </Link>.
        </p>
        
        <h3 className="font-medium mb-2">Available Endpoints:</h3>
        
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <span className="font-medium">Drug Search:</span>
            <ul className="list-disc pl-5 mt-1">
              <li><code className="bg-gray-100 px-1 rounded">/api/drugs/search?q=query</code> - Search for drugs by name</li>
              <li><code className="bg-gray-100 px-1 rounded">/api/drugs/prefix/[prefix]</code> - Search for drugs by prefix</li>
            </ul>
          </li>
          <li>
            <span className="font-medium">Drug Prices:</span>
            <ul className="list-disc pl-5 mt-1">
              <li><code className="bg-gray-100 px-1 rounded">/api/drugs/prices</code> - Get prices for a drug</li>
              <li><code className="bg-gray-100 px-1 rounded">/api/drugs/group-prices</code> - Get prices grouped by pharmacy chain</li>
            </ul>
          </li>
          <li>
            <span className="font-medium">API Status:</span>
            <ul className="list-disc pl-5 mt-1">
              <li><code className="bg-gray-100 px-1 rounded">/api/test-connection</code> - Test API connection status</li>
            </ul>
          </li>
        </ul>
      </div>

      <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Direct API Links</h2>
        <p className="mb-4">
          These links open the API endpoints directly in a new tab. Use these to test if the API endpoints are accessible without authentication:
        </p>
        <div className="space-y-2">
          <a 
            href="/api/public/status" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-2 bg-green-100 hover:bg-green-200 rounded"
          >
            Test Public Status API (No Auth Required)
          </a>
          <a 
            href="/api/drugs/search?query=lip" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-2 bg-blue-100 hover:bg-blue-200 rounded"
          >
            Test Drug Search API
          </a>
          <a 
            href="/api/drugs/prefix/lip" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-2 bg-blue-100 hover:bg-blue-200 rounded"
          >
            Test Drug Prefix Search API
          </a>
          <a 
            href="/api/drugs/info/name/lipitor" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-2 bg-blue-100 hover:bg-blue-200 rounded"
          >
            Test Drug Info API
          </a>
        </div>
      </div>
    </div>
  )
} 