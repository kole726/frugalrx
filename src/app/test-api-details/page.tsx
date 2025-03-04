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

export default function TestApiDetailsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Record<string, ApiTestResult>>({})
  const [activeTab, setActiveTab] = useState('drugInfo')
  const [formData, setFormData] = useState<FormDataType>({})
  const [expandedResults, setExpandedResults] = useState<string[]>([])
  const [testLog, setTestLog] = useState<string[]>([])
  const [showRawResponse, setShowRawResponse] = useState(false)

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">America's Pharmacy API Testing Tool</h1>
        <div className="space-x-2">
          <button
            onClick={runAllTests}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Running Tests...' : 'Run All Tests'}
          </button>
          <button
            onClick={clearResults}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            Clear Results
          </button>
          <Link href="/" className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md">
            Back to Home
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {Object.entries(apiOperations).map(([category, operations]) => (
            <button
              key={category}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === category
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(category)}
            >
              {category.split(/(?=[A-Z])/).join(' ')} ({operations.length})
            </button>
          ))}
          <button
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'log'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('log')}
          >
            Test Log
          </button>
        </div>
      </div>

      {/* Test Log Tab */}
      {activeTab === 'log' ? (
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
                          {results[operation.id].status && ` (${results[operation.id].status})`}
                          {results[operation.id].duration && ` - ${results[operation.id].duration.toFixed(0)}ms`}
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