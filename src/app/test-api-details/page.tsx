'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TestApiDetailsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [testLog, setTestLog] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    const runTests = async () => {
      try {
        setLoading(true)
        setError(null)
        setTestLog(prev => [...prev, 'Starting detailed API tests...'])
        
        // Test the connection endpoint
        setTestLog(prev => [...prev, 'Testing API endpoints with alternative URL structures...'])
        const response = await fetch('/api/test-api-details')
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`)
        }
        
        const data = await response.json()
        setTestLog(prev => [...prev, 'Received test results'])
        setTestLog(prev => [...prev, JSON.stringify(data, null, 2)])
        setTestResults(data)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setTestLog(prev => [...prev, `Error: ${errorMessage}`])
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }
    
    runTests()
  }, [])
  
  const handleRunAgain = () => {
    setTestLog([])
    router.refresh()
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Detailed API Tests</h1>
      
      {loading && (
        <div className="mb-6">
          <div className="animate-pulse bg-blue-100 p-4 rounded-lg">
            <p className="text-blue-800">Running detailed API tests...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-6">
          <div className="bg-red-100 p-4 rounded-lg">
            <p className="text-red-800 font-semibold">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {testResults && (
        <div className="mb-6">
          <div className="bg-green-100 p-4 rounded-lg mb-4">
            <h2 className="text-xl font-semibold text-green-800 mb-2">Test Results</h2>
            <p className="mb-2">
              <span className="font-semibold">Timestamp:</span> {testResults.timestamp}
            </p>
            
            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-2">Authentication Test:</h3>
              <div className={`p-3 rounded-lg ${testResults.tests.authentication.includes('Success') ? 'bg-green-200' : 'bg-red-200'}`}>
                {testResults.tests.authentication}
              </div>
            </div>
            
            {testResults.tests.endpoints && (
              <div>
                <h3 className="font-semibold text-lg mb-2">API Endpoint Tests:</h3>
                
                <div className="mb-3">
                  <h4 className="font-medium mb-1">Drug Info Endpoint:</h4>
                  <div className={`p-3 rounded-lg ${testResults.tests.endpoints.drugInfo.success ? 'bg-green-200' : 'bg-red-200'}`}>
                    <p><span className="font-semibold">Status:</span> {testResults.tests.endpoints.drugInfo.success ? 'Success' : 'Failed'}</p>
                    {testResults.tests.endpoints.drugInfo.url && (
                      <p><span className="font-semibold">URL:</span> {testResults.tests.endpoints.drugInfo.url}</p>
                    )}
                    {testResults.tests.endpoints.drugInfo.note && (
                      <p><span className="font-semibold">Note:</span> {testResults.tests.endpoints.drugInfo.note}</p>
                    )}
                    {testResults.tests.endpoints.drugInfo.error && (
                      <p><span className="font-semibold">Error:</span> {testResults.tests.endpoints.drugInfo.error}</p>
                    )}
                  </div>
                </div>
                
                <div className="mb-3">
                  <h4 className="font-medium mb-1">Drug Search Endpoint:</h4>
                  <div className={`p-3 rounded-lg ${testResults.tests.endpoints.drugSearch.success ? 'bg-green-200' : 'bg-red-200'}`}>
                    <p><span className="font-semibold">Status:</span> {testResults.tests.endpoints.drugSearch.success ? 'Success' : 'Failed'}</p>
                    {testResults.tests.endpoints.drugSearch.url && (
                      <p><span className="font-semibold">URL:</span> {testResults.tests.endpoints.drugSearch.url}</p>
                    )}
                    {testResults.tests.endpoints.drugSearch.note && (
                      <p><span className="font-semibold">Note:</span> {testResults.tests.endpoints.drugSearch.note}</p>
                    )}
                    {testResults.tests.endpoints.drugSearch.error && (
                      <p><span className="font-semibold">Error:</span> {testResults.tests.endpoints.drugSearch.error}</p>
                    )}
                  </div>
                </div>
                
                <div className="mb-3">
                  <h4 className="font-medium mb-1">Pharmacy Prices Endpoint:</h4>
                  <div className={`p-3 rounded-lg ${testResults.tests.endpoints.pharmacyPrices.success ? 'bg-green-200' : 'bg-red-200'}`}>
                    <p><span className="font-semibold">Status:</span> {testResults.tests.endpoints.pharmacyPrices.success ? 'Success' : 'Failed'}</p>
                    {testResults.tests.endpoints.pharmacyPrices.url && (
                      <p><span className="font-semibold">URL:</span> {testResults.tests.endpoints.pharmacyPrices.url}</p>
                    )}
                    {testResults.tests.endpoints.pharmacyPrices.note && (
                      <p><span className="font-semibold">Note:</span> {testResults.tests.endpoints.pharmacyPrices.note}</p>
                    )}
                    {testResults.tests.endpoints.pharmacyPrices.error && (
                      <p><span className="font-semibold">Error:</span> {testResults.tests.endpoints.pharmacyPrices.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Environment Variables</h3>
            <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(testResults.environment, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Test Log</h3>
        <div className="bg-gray-100 p-4 rounded-lg">
          <pre className="whitespace-pre-wrap">
            {testLog.join('\n')}
          </pre>
        </div>
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={handleRunAgain}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          disabled={loading}
        >
          Run Tests Again
        </button>
        
        <button
          onClick={() => window.location.href = '/test-api'}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          Back to Basic Tests
        </button>
        
        <button
          onClick={() => window.location.href = '/'}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          Back to Home
        </button>
      </div>
    </div>
  )
} 