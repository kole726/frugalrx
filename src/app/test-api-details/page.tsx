'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface ApiTestResult {
  success: boolean
  data?: any
  error?: string
  status?: number
  url?: string
  duration?: number
  rawResponse?: string
}

interface TestOperation {
  id: string
  name: string
  description: string
  endpoint: string
  method: string
  formFields: {
    name: string
    type: string
    required: boolean
    default?: string | number
    description: string
  }[]
}

// Define the type for form data
interface FormDataType {
  [operationId: string]: {
    [fieldName: string]: any
  }
}

// Define the type for API connection test results
interface ConnectionTestResult {
  timestamp: string
  envVars: {
    apiUrl: string
    apiKey: string
    apiSecret: string
    apiVersion: string
  }
  tests: {
    authentication: {
      success: boolean
      message: string
      token?: string
    }
    apiConnection: {
      success: boolean
      message: string
      details?: any
      endpointTests?: {
        drugInfo: {
          success: boolean
          status: number
          url: string
          data: any
        }
        drugSearch: {
          success: boolean
          status: number
          url: string
          data: any
        }
        pharmacyPrices: {
          success: boolean
          status: number
          url: string
          data: any
        }
      }
    }
  }
}

export default function TestApiDetailsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Record<string, ApiTestResult>>({})
  const [activeTab, setActiveTab] = useState('drugInfo')
  const [formData, setFormData] = useState<FormDataType>({})
  const [expandedResults, setExpandedResults] = useState<string[]>([])
  const [testLog, setTestLog] = useState<string[]>([])
  const [showRawResponse, setShowRawResponse] = useState(false)
  
  // State for API connection test
  const [connectionTestLoading, setConnectionTestLoading] = useState(false)
  const [connectionTestResults, setConnectionTestResults] = useState<ConnectionTestResult | null>(null)
  const [connectionTestError, setConnectionTestError] = useState<string | null>(null)

  // Define all API operations
  const apiOperations: Record<string, TestOperation[]> = {
    drugInfo: [
      {
        id: 'opGetDrugInfo',
        name: 'Get Drug Info',
        description: 'Provides detailed information about the requested drug, such as usage, interactions, etc.',
        endpoint: '/api/drugs/info/gsn',
        method: 'GET',
        formFields: [
          {
            name: 'gsn',
            type: 'number',
            required: true,
            default: 62733,
            description: 'Generic Sequence Number (GSN)'
          },
          {
            name: 'languageCode',
            type: 'string',
            required: false,
            default: 'en',
            description: 'Language code (e.g., "en" for English, "es" for Spanish)'
          }
        ]
      }
    ],
    drugPricing: [
      {
        id: 'opGetPharmacyDrugPricingbyGSN',
        name: 'Get Drug Pricing by GSN',
        description: 'Returns pricing based on the drug\'s Generic Sequence Number (GSN)',
        endpoint: '/api/drugs/prices',
        method: 'POST',
        formFields: [
          {
            name: 'gsn',
            type: 'number',
            required: true,
            default: 62733,
            description: 'Generic Sequence Number (GSN)'
          },
          {
            name: 'latitude',
            type: 'number',
            required: true,
            default: 30.2672,
            description: 'Latitude coordinate'
          },
          {
            name: 'longitude',
            type: 'number',
            required: true,
            default: -97.7431,
            description: 'Longitude coordinate'
          },
          {
            name: 'radius',
            type: 'number',
            required: false,
            default: 10,
            description: 'Search radius in miles'
          },
          {
            name: 'quantity',
            type: 'number',
            required: false,
            default: 30,
            description: 'Medication quantity'
          }
        ]
      },
      {
        id: 'opGetPharmacyDrugPricingbyName',
        name: 'Get Drug Pricing by Name',
        description: 'Returns pricing based on drug name',
        endpoint: '/api/drugs/prices',
        method: 'POST',
        formFields: [
          {
            name: 'drugName',
            type: 'string',
            required: true,
            default: 'lipitor',
            description: 'Drug name'
          },
          {
            name: 'latitude',
            type: 'number',
            required: true,
            default: 30.2672,
            description: 'Latitude coordinate'
          },
          {
            name: 'longitude',
            type: 'number',
            required: true,
            default: -97.7431,
            description: 'Longitude coordinate'
          },
          {
            name: 'radius',
            type: 'number',
            required: false,
            default: 10,
            description: 'Search radius in miles'
          },
          {
            name: 'quantity',
            type: 'number',
            required: false,
            default: 30,
            description: 'Medication quantity'
          }
        ]
      },
      {
        id: 'opGetPharmacyDrugPricingbyNDC',
        name: 'Get Drug Pricing by NDC',
        description: 'Returns pricing based on the drug\'s National Drug Code (NDC)',
        endpoint: '/api/drugs/prices/ndc',
        method: 'POST',
        formFields: [
          {
            name: 'ndcCode',
            type: 'string',
            required: true,
            default: '70954014010',
            description: 'National Drug Code (NDC)'
          },
          {
            name: 'latitude',
            type: 'number',
            required: true,
            default: 30.2672,
            description: 'Latitude coordinate'
          },
          {
            name: 'longitude',
            type: 'number',
            required: true,
            default: -97.7431,
            description: 'Longitude coordinate'
          },
          {
            name: 'radius',
            type: 'number',
            required: false,
            default: 10,
            description: 'Search radius in miles'
          },
          {
            name: 'quantity',
            type: 'number',
            required: false,
            default: 30,
            description: 'Medication quantity'
          }
        ]
      }
    ],
    drugSearch: [
      {
        id: 'opFindDrugByName',
        name: 'Find Drug by Name',
        description: 'Provides list of drugs that start with the requested drug or drug prefix',
        endpoint: '/api/drugs/autocomplete',
        method: 'GET',
        formFields: [
          {
            name: 'query',
            type: 'string',
            required: true,
            default: 'lipi',
            description: 'Drug name prefix'
          },
          {
            name: 'count',
            type: 'number',
            required: false,
            default: 10,
            description: 'Maximum number of results to return'
          }
        ]
      }
    ],
    groupPricing: [
      {
        id: 'opGetGroupPharmacyDrugPricing',
        name: 'Get Group Pharmacy Drug Pricing',
        description: 'Returns pricing aggregated by pharmacy chain',
        endpoint: '/api/drugs/prices/group',
        method: 'POST',
        formFields: [
          {
            name: 'gsn',
            type: 'number',
            required: false,
            default: 62733,
            description: 'Generic Sequence Number (GSN)'
          },
          {
            name: 'drugName',
            type: 'string',
            required: false,
            default: '',
            description: 'Drug name (alternative to GSN)'
          },
          {
            name: 'latitude',
            type: 'number',
            required: true,
            default: 30.2672,
            description: 'Latitude coordinate'
          },
          {
            name: 'longitude',
            type: 'number',
            required: true,
            default: -97.7431,
            description: 'Longitude coordinate'
          },
          {
            name: 'radius',
            type: 'number',
            required: false,
            default: 10,
            description: 'Search radius in miles'
          }
        ]
      }
    ],
    multiDrugPricing: [
      {
        id: 'opGetPharmacyMultiDrugPricingbyGSN',
        name: 'Get Multi-Drug Pricing by GSN',
        description: 'Returns pricing for multiple drugs based on their GSNs',
        endpoint: '/api/drugs/prices/multi/gsn',
        method: 'POST',
        formFields: [
          {
            name: 'gsns',
            type: 'string',
            required: true,
            default: '62733,70954,2323',
            description: 'Comma-separated list of GSNs'
          },
          {
            name: 'latitude',
            type: 'number',
            required: true,
            default: 30.2672,
            description: 'Latitude coordinate'
          },
          {
            name: 'longitude',
            type: 'number',
            required: true,
            default: -97.7431,
            description: 'Longitude coordinate'
          },
          {
            name: 'radius',
            type: 'number',
            required: false,
            default: 10,
            description: 'Search radius in miles'
          }
        ]
      },
      {
        id: 'opGetPharmacyMultiDrugPricingbyName',
        name: 'Get Multi-Drug Pricing by Name',
        description: 'Returns pricing for multiple drugs based on their names',
        endpoint: '/api/drugs/prices/multi/name',
        method: 'POST',
        formFields: [
          {
            name: 'drugNames',
            type: 'string',
            required: true,
            default: 'lipitor,metformin,advil',
            description: 'Comma-separated list of drug names'
          },
          {
            name: 'latitude',
            type: 'number',
            required: true,
            default: 30.2672,
            description: 'Latitude coordinate'
          },
          {
            name: 'longitude',
            type: 'number',
            required: true,
            default: -97.7431,
            description: 'Longitude coordinate'
          },
          {
            name: 'radius',
            type: 'number',
            required: false,
            default: 10,
            description: 'Search radius in miles'
          }
        ]
      }
    ]
  }

  // Initialize form data with default values
  useEffect(() => {
    const initialFormData: Record<string, Record<string, any>> = {}
    
    Object.entries(apiOperations).forEach(([category, operations]) => {
      operations.forEach(operation => {
        initialFormData[operation.id] = {}
        operation.formFields.forEach(field => {
          initialFormData[operation.id][field.name] = field.default
        })
      })
    })
    
    setFormData(initialFormData)
  }, [])

  const handleInputChange = (operationId: string, fieldName: string, value: any) => {
    setFormData(prev => {
      // Ensure the operation exists in the form data
      const currentOperationData = prev[operationId] || {};
      
      return {
        ...prev,
        [operationId]: {
          ...currentOperationData,
          [fieldName]: value
        }
      };
    });
  }

  const toggleResultExpansion = (operationId: string) => {
    setExpandedResults(prev => 
      prev.includes(operationId) 
        ? prev.filter(id => id !== operationId)
        : [...prev, operationId]
    )
  }

  const addToLog = (message: string) => {
    setTestLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const runTest = async (operation: TestOperation) => {
    setIsLoading(true)
    addToLog(`Testing ${operation.name}...`)
    
    try {
      const startTime = performance.now()
      
      // Prepare request data
      const data = formData[operation.id]
      let url = operation.endpoint
      let requestOptions: RequestInit = {
        method: operation.method,
        headers: {
          'Content-Type': 'application/json'
        }
      }
      
      // Handle different request methods
      if (operation.method === 'GET') {
        // For GET requests, add parameters to URL
        const params = new URLSearchParams()
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.append(key, value.toString())
          }
        })
        url = `${url}?${params.toString()}`
      } else {
        // For POST requests, add data to body
        // Special handling for multi-drug endpoints
        if (operation.id.includes('Multi')) {
          // Parse comma-separated values into arrays
          const processedData = { ...data }
          
          if (processedData.gsns) {
            processedData.gsns = processedData.gsns.split(',').map((gsn: string) => parseInt(gsn.trim()))
          }
          
          if (processedData.drugNames) {
            processedData.drugNames = processedData.drugNames.split(',').map((name: string) => name.trim())
          }
          
          if (processedData.ndcCodes) {
            processedData.ndcCodes = processedData.ndcCodes.split(',').map((code: string) => code.trim())
          }
          
          requestOptions.body = JSON.stringify(processedData)
        } else {
          requestOptions.body = JSON.stringify(data)
        }
      }
      
      addToLog(`Sending ${operation.method} request to ${url}`)
      if (operation.method === 'POST') {
        addToLog(`Request body: ${requestOptions.body}`)
      }
      
      // Make the API request
      const response = await fetch(url, requestOptions)
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Handle response
      let responseData
      let responseText = ''
      
      try {
        responseText = await response.text()
        responseData = JSON.parse(responseText)
      } catch (e) {
        responseData = { text: responseText }
      }
      
      if (response.ok) {
        addToLog(`✅ ${operation.name} succeeded in ${duration.toFixed(0)}ms`)
        setResults(prev => ({
          ...prev,
          [operation.id]: {
            success: true,
            data: responseData,
            status: response.status,
            url,
            duration,
            rawResponse: responseText
          }
        }))
        
        // Auto-expand successful results
        if (!expandedResults.includes(operation.id)) {
          toggleResultExpansion(operation.id)
        }
      } else {
        addToLog(`❌ ${operation.name} failed with status ${response.status}`)
        setResults(prev => ({
          ...prev,
          [operation.id]: {
            success: false,
            error: responseData.error || `API returned status ${response.status}`,
            data: responseData,
            status: response.status,
            url,
            duration,
            rawResponse: responseText
          }
        }))
      }
    } catch (error) {
      addToLog(`❌ ${operation.name} failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setResults(prev => ({
        ...prev,
        [operation.id]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          url: operation.endpoint
        }
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const runAllTests = async () => {
    setIsLoading(true)
    setResults({})
    setTestLog([`[${new Date().toLocaleTimeString()}] Starting all tests...`])
    
    // Get all operations from all categories
    const allOperations = Object.values(apiOperations).flat()
    
    // Run tests sequentially to avoid overwhelming the API
    for (const operation of allOperations) {
      await runTest(operation)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsLoading(false)
    addToLog('All tests completed')
    toast.success('All tests completed')
  }

  const clearResults = () => {
    setResults({})
    setTestLog([])
    toast.success('Results cleared')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  // Function to run API connection test
  const runConnectionTest = async () => {
    setConnectionTestLoading(true)
    setConnectionTestError(null)
    setConnectionTestResults(null)
    
    try {
      const startTime = Date.now()
      const response = await fetch('/api/test-connection')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to test API connection')
      }
      
      setConnectionTestResults(data)
      toast.success('API connection test completed')
    } catch (error) {
      console.error('Error testing API connection:', error)
      setConnectionTestError(error instanceof Error ? error.message : 'An unknown error occurred')
      toast.error('Failed to test API connection')
    } finally {
      setConnectionTestLoading(false)
    }
  }

  // Function to safely get token preview
  const getTokenPreview = (token: string | undefined) => {
    if (!token) return '';
    return token.substring(0, 40) + '...';
  }

  // Helper function to safely format duration
  const formatDuration = (result: ApiTestResult | undefined) => {
    if (!result || typeof result.duration !== 'number') return '';
    return ` - ${result.duration.toFixed(0)}ms`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">API Testing Tool</h1>
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          Back to Home
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap border-b border-gray-200">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'connection' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('connection')}
          >
            API Connection Test
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'drugInfo' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('drugInfo')}
          >
            Drug Info
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'drugPricing' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('drugPricing')}
          >
            Drug Pricing
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'drugSearch' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('drugSearch')}
          >
            Drug Search
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'groupPricing' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('groupPricing')}
          >
            Group Pricing
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'multiDrugPricing' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('multiDrugPricing')}
          >
            Multi-Drug Pricing
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'log' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('log')}
          >
            Test Log
          </button>
        </div>
      </div>

      {/* API Connection Test Tab */}
      {activeTab === 'connection' ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">API Connection Test</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Tests connectivity to the API endpoints including authentication, drug search, pharmacy pricing, and pharmacy map.
                </p>
              </div>
              <button
                onClick={runConnectionTest}
                disabled={connectionTestLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50"
              >
                {connectionTestLoading ? 'Testing...' : 'Run Connection Test'}
              </button>
            </div>
          </div>

          {connectionTestError && (
            <div className="p-4 border-t border-gray-200 bg-red-50">
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">
                {connectionTestError}
              </div>
            </div>
          )}

          {connectionTestResults && (
            <div className="p-4 border-t border-gray-200">
              <div className="mb-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Environment Variables</h4>
                <div className="bg-gray-900 p-3 rounded-md text-xs text-green-400 font-mono">
                  <pre>
{`"apiUrl": "${connectionTestResults.envVars.apiUrl}",
"apiKey": "${connectionTestResults.envVars.apiKey ? '✓ Set' : '✗ Not Set'}",
"apiSecret": "${connectionTestResults.envVars.apiSecret ? '✓ Set' : '✗ Not Set'}",
"apiVersion": "${connectionTestResults.envVars.apiVersion}",
"timestamp": "${connectionTestResults.timestamp}"`}
                  </pre>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Authentication Test</h4>
                <div className={`p-3 rounded-md ${connectionTestResults.tests.authentication.success ? 'bg-green-100' : 'bg-red-100'}`}>
                  <div className="flex items-center mb-2">
                    {connectionTestResults.tests.authentication.success ? (
                      <span className="text-green-500 mr-2">✓</span>
                    ) : (
                      <span className="text-red-500 mr-2">✗</span>
                    )}
                    <span className={connectionTestResults.tests.authentication.success ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                      {connectionTestResults.tests.authentication.success ? 'Authentication Successful' : 'Authentication Failed'}
                    </span>
                  </div>
                  <div className="text-sm">
                    {connectionTestResults.tests.authentication.message}
                    {connectionTestResults.tests.authentication.token ? (
                      <div className="mt-2">
                        <div className="font-medium">Token Preview:</div>
                        <div className="bg-gray-900 p-2 rounded-md overflow-x-auto mt-1">
                          <pre className="text-green-400 text-xs">
                            {connectionTestResults.tests.authentication.token.substring(0, 40)}...
                          </pre>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">API Endpoint Tests</h4>
                
                {/* Drug Info Endpoint Test */}
                <div className="mb-3">
                  <div className={`p-3 rounded-md ${connectionTestResults.tests.apiConnection?.endpointTests?.drugInfo?.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    <div className="flex items-center mb-2">
                      {connectionTestResults.tests.apiConnection?.endpointTests?.drugInfo?.success ? (
                        <span className="text-green-500 mr-2">✓</span>
                      ) : (
                        <span className="text-red-500 mr-2">✗</span>
                      )}
                      <span className={connectionTestResults.tests.apiConnection?.endpointTests?.drugInfo?.success ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                        Drug Information API
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      Status: {connectionTestResults.tests.apiConnection?.endpointTests?.drugInfo?.status || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      URL: {connectionTestResults.tests.apiConnection?.endpointTests?.drugInfo?.url || 'N/A'}
                    </div>
                    {connectionTestResults.tests.apiConnection?.endpointTests?.drugInfo?.data && (
                      <div className="mt-2">
                        <div className="font-medium text-xs">Response:</div>
                        <div className="bg-gray-900 p-2 rounded-md overflow-x-auto mt-1">
                          <pre className="text-green-400 text-xs">
                            {typeof connectionTestResults.tests.apiConnection.endpointTests.drugInfo.data === 'string' 
                              ? connectionTestResults.tests.apiConnection.endpointTests.drugInfo.data 
                              : JSON.stringify(connectionTestResults.tests.apiConnection.endpointTests.drugInfo.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Drug Search Endpoint Test */}
                <div className="mb-3">
                  <div className={`p-3 rounded-md ${connectionTestResults.tests.apiConnection?.endpointTests?.drugSearch?.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    <div className="flex items-center mb-2">
                      {connectionTestResults.tests.apiConnection?.endpointTests?.drugSearch?.success ? (
                        <span className="text-green-500 mr-2">✓</span>
                      ) : (
                        <span className="text-red-500 mr-2">✗</span>
                      )}
                      <span className={connectionTestResults.tests.apiConnection?.endpointTests?.drugSearch?.success ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                        Drug Search API
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      Status: {connectionTestResults.tests.apiConnection?.endpointTests?.drugSearch?.status || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      URL: {connectionTestResults.tests.apiConnection?.endpointTests?.drugSearch?.url || 'N/A'}
                    </div>
                    {connectionTestResults.tests.apiConnection?.endpointTests?.drugSearch?.data && (
                      <div className="mt-2">
                        <div className="font-medium text-xs">Response:</div>
                        <div className="bg-gray-900 p-2 rounded-md overflow-x-auto mt-1">
                          <pre className="text-green-400 text-xs">
                            {typeof connectionTestResults.tests.apiConnection.endpointTests.drugSearch.data === 'string' 
                              ? connectionTestResults.tests.apiConnection.endpointTests.drugSearch.data 
                              : JSON.stringify(connectionTestResults.tests.apiConnection.endpointTests.drugSearch.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pharmacy Prices Endpoint Test */}
                <div>
                  <div className={`p-3 rounded-md ${connectionTestResults.tests.apiConnection?.endpointTests?.pharmacyPrices?.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    <div className="flex items-center mb-2">
                      {connectionTestResults.tests.apiConnection?.endpointTests?.pharmacyPrices?.success ? (
                        <span className="text-green-500 mr-2">✓</span>
                      ) : (
                        <span className="text-red-500 mr-2">✗</span>
                      )}
                      <span className={connectionTestResults.tests.apiConnection?.endpointTests?.pharmacyPrices?.success ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                        Pharmacy Prices API
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      Status: {connectionTestResults.tests.apiConnection?.endpointTests?.pharmacyPrices?.status || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      URL: {connectionTestResults.tests.apiConnection?.endpointTests?.pharmacyPrices?.url || 'N/A'}
                    </div>
                    {connectionTestResults.tests.apiConnection?.endpointTests?.pharmacyPrices?.data && (
                      <div className="mt-2">
                        <div className="font-medium text-xs">Response:</div>
                        <div className="bg-gray-900 p-2 rounded-md overflow-x-auto mt-1">
                          <pre className="text-green-400 text-xs">
                            {typeof connectionTestResults.tests.apiConnection.endpointTests.pharmacyPrices.data === 'string' 
                              ? connectionTestResults.tests.apiConnection.endpointTests.pharmacyPrices.data 
                              : JSON.stringify(connectionTestResults.tests.apiConnection.endpointTests.pharmacyPrices.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {connectionTestResults.tests.apiConnection?.details && (
                <div className="mt-4">
                  <div className="font-medium text-sm">Additional Details:</div>
                  <div className="bg-gray-900 p-2 rounded-md overflow-x-auto mt-1">
                    <pre className="text-green-400 text-xs">
                      {JSON.stringify(connectionTestResults.tests.apiConnection.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : activeTab === 'log' ? (
        <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm h-[600px] overflow-y-auto">
          {testLog.length > 0 ? (
            testLog.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          ) : (
            <div className="text-gray-500">No test logs yet. Run some tests to see logs here.</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {apiOperations[activeTab]?.map(operation => (
            <div key={operation.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{operation.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{operation.description}</p>
                    <div className="mt-1 text-xs text-gray-500">
                      <span className="font-medium">{operation.method}</span> {operation.endpoint}
                    </div>
                  </div>
                  <button
                    onClick={() => runTest(operation)}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50"
                  >
                    {isLoading ? 'Running...' : 'Run Test'}
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <h4 className="font-medium text-sm text-gray-700 mb-3">Request Parameters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {operation.formFields.map(field => (
                    <div key={field.name} className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        {field.name} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={(formData[operation.id]?.[field.name] ?? '') as string}
                        onChange={e => handleInputChange(
                          operation.id,
                          field.name,
                          field.type === 'number' ? parseFloat(e.target.value) : e.target.value
                        )}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder={field.description}
                      />
                      <p className="text-xs text-gray-500">{field.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {results[operation.id] && (
                <div className="border-t border-gray-200">
                  <div 
                    className={`p-4 cursor-pointer ${
                      results[operation.id].success ? 'bg-green-50' : 'bg-red-50'
                    }`}
                    onClick={() => toggleResultExpansion(operation.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {results[operation.id].success ? (
                          <span className="text-green-500 mr-2">✓</span>
                        ) : (
                          <span className="text-red-500 mr-2">✗</span>
                        )}
                        <span className={results[operation.id].success ? 'text-green-700' : 'text-red-700'}>
                          {results[operation.id].success ? 'Success' : 'Failed'}
                          {results[operation.id]?.status && ` (${results[operation.id].status})`}
                          {formatDuration(results[operation.id])}
                        </span>
                      </div>
                      <svg
                        className={`h-5 w-5 transform ${expandedResults.includes(operation.id) ? 'rotate-180' : ''}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>

                  {expandedResults.includes(operation.id) && (
                    <div className="p-4 border-t border-gray-200 bg-white">
                      {results[operation.id].error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">
                          {results[operation.id].error}
                        </div>
                      )}

                      <div className="flex justify-between mb-2">
                        <h4 className="font-medium text-sm text-gray-700">Response</h4>
                        <div className="space-x-2">
                          <button
                            onClick={() => setShowRawResponse(!showRawResponse)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            {showRawResponse ? 'Show Formatted' : 'Show Raw'}
                          </button>
                          <button
                            onClick={() => copyToClipboard(
                              showRawResponse 
                                ? results[operation.id].rawResponse || JSON.stringify(results[operation.id].data, null, 2)
                                : JSON.stringify(results[operation.id].data, null, 2)
                            )}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      <div className="bg-gray-900 p-3 rounded-md overflow-x-auto max-h-96 overflow-y-auto">
                        <pre className="text-green-400 text-xs">
                          {showRawResponse 
                            ? results[operation.id].rawResponse || JSON.stringify(results[operation.id].data, null, 2)
                            : JSON.stringify(results[operation.id].data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 