"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function DebugPage() {
  const [envData, setEnvData] = useState<any>(null)
  const [apiData, setApiData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDebugData() {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch environment data
        const envResponse = await fetch('/api/debug/env')
        const envJson = await envResponse.json()
        setEnvData(envJson)
        
        // Fetch API data
        const apiResponse = await fetch('/api/debug/api')
        const apiJson = await apiResponse.json()
        setApiData(apiJson)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDebugData()
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
        <p>Loading debug information...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
        </div>
        <Link href="/" className="text-blue-500 hover:underline">
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Environment Information</h2>
        <div className="bg-gray-100 p-4 rounded overflow-auto">
          <pre className="whitespace-pre-wrap">{JSON.stringify(envData, null, 2)}</pre>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">API Information</h2>
        <div className="bg-gray-100 p-4 rounded overflow-auto">
          <pre className="whitespace-pre-wrap">{JSON.stringify(apiData, null, 2)}</pre>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">API Status</h2>
        <div className={`p-4 rounded ${apiData?.tokenObtained ? 'bg-green-100' : 'bg-red-100'}`}>
          <p className="font-bold">
            Token Status: {apiData?.tokenObtained ? 'Available' : 'Not Available'}
          </p>
          {apiData?.tokenError && (
            <p className="text-red-700 mt-2">Error: {apiData.tokenError}</p>
          )}
          {apiData?.apiTestResult && (
            <div className="mt-4">
              <p className="font-bold">API Test Result:</p>
              <p>Status Code: {apiData.apiTestResult.statusCode}</p>
              {apiData.apiTestResult.error && (
                <p className="text-red-700">Error: {apiData.apiTestResult.error}</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link 
            href="/api-test" 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to API Test Page
          </Link>
          <Link 
            href="/" 
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
} 