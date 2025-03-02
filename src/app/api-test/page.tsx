"use client"

import { useState } from 'react'

export default function ApiTestPage() {
  const [prefix, setPrefix] = useState('trin')
  const [hqMappingName, setHqMappingName] = useState('walkerrx')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mappingOptions = [
    'walkerrx',
    'frugal',
    'americaspharmacy',
    'strategycorps',
    'default'
  ]

  const handleTest = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/test-mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prefix, hqMappingName })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to test API')
      }
      
      setResults(data)
    } catch (err) {
      console.error('Error testing API:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">America's Pharmacy API Test</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Drug Prefix</label>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter drug prefix (e.g., trin)"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">HQ Mapping Name</label>
          <select
            value={hqMappingName}
            onChange={(e) => setHqMappingName(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {mappingOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={handleTest}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test API'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {results && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Results</h2>
          
          <div className="mb-4">
            <h3 className="font-medium">Parameters</h3>
            <div className="bg-gray-100 p-2 rounded">
              <p>Prefix: <span className="font-mono">{results.parameters.prefix}</span></p>
              <p>HQ Mapping: <span className="font-mono">{results.parameters.hqMappingName}</span></p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">API Response</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
              {JSON.stringify(results.results, null, 2)}
            </pre>
          </div>
          
          {Array.isArray(results.results) && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Drug Names ({results.results.length})</h3>
              <ul className="list-disc pl-5">
                {results.results.map((item: any, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 