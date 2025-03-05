'use client'

import { useState, useEffect, FormEvent } from 'react'
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

// Define types for drug info response
interface DrugForm {
  form: string;
  gsn: number;
  selected?: boolean;
  rank?: number;
}

interface DrugStrength {
  strength: string;
  gsn?: number;
  selected?: boolean;
  rank?: number;
}

interface DrugQuantity {
  quantity: number;
  uom: string;
  gsn?: number;
  selected?: boolean;
  rank?: number;
}

interface DrugInfoResponse {
  brandName?: string;
  genericName?: string;
  forms?: DrugForm[];
  strengths?: DrugStrength[];
  quantities?: DrugQuantity[];
  [key: string]: any;
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

// Component to display detailed drug information
const DrugInfoDetails = ({ 
  data, 
  onGsnChange, 
  currentOperation,
  onRunTest 
}: { 
  data: DrugInfoResponse, 
  onGsnChange?: (gsn: number) => void,
  currentOperation?: TestOperation,
  onRunTest?: (operation: TestOperation) => void
}) => {
  const [selectedBrandType, setSelectedBrandType] = useState<'brand' | 'generic'>('brand');
  const [selectedForm, setSelectedForm] = useState<DrugForm | null>(null);
  const [selectedStrength, setSelectedStrength] = useState<DrugStrength | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<DrugQuantity | null>(null);
  
  // Initialize selections when data changes
  useEffect(() => {
    // Find the selected form (if any)
    const selectedFormItem = data.forms?.find(form => form.selected) || data.forms?.[0] || null;
    setSelectedForm(selectedFormItem);
    
    // Find the selected strength (if any)
    const selectedStrengthItem = data.strengths?.find(strength => strength.selected) || data.strengths?.[0] || null;
    setSelectedStrength(selectedStrengthItem);
    
    // Find the selected quantity (if any)
    const selectedQuantityItem = data.quantities?.find(quantity => quantity.selected) || data.quantities?.[0] || null;
    setSelectedQuantity(selectedQuantityItem);
  }, [data]);
  
  // Determine if we have both brand and generic names
  const hasBothNames = data.brandName && data.genericName && data.brandName !== data.genericName;
  
  // Handle form change
  const handleFormChange = (form: DrugForm | null) => {
    setSelectedForm(form);
    if (form && onGsnChange) {
      console.log(`Changing GSN to ${form.gsn} for form ${form.form}`);
      onGsnChange(form.gsn);
      
      // Reset strength and quantity since they will be updated when new data arrives
      setSelectedStrength(null);
      setSelectedQuantity(null);
      
      // Automatically run the test if operation is provided
      if (currentOperation && onRunTest) {
        setTimeout(() => {
          onRunTest(currentOperation);
        }, 100); // Small delay to ensure form data is updated
      }
    }
  };
  
  // Handle strength change
  const handleStrengthChange = (strength: DrugStrength | null) => {
    setSelectedStrength(strength);
    
    // If the strength has a GSN and it's different from the current form's GSN, update it
    if (strength?.gsn && selectedForm?.gsn !== strength.gsn && onGsnChange) {
      console.log(`Changing GSN to ${strength.gsn} for strength ${strength.strength}`);
      onGsnChange(strength.gsn);
      
      // Automatically run the test if operation is provided
      if (currentOperation && onRunTest) {
        setTimeout(() => {
          onRunTest(currentOperation);
        }, 100); // Small delay to ensure form data is updated
      }
    }
  };
  
  // Handle quantity change
  const handleQuantityChange = (quantity: DrugQuantity | null) => {
    setSelectedQuantity(quantity);
    
    // If the quantity has a GSN and it's different from the current form's GSN, update it
    if (quantity?.gsn && selectedForm?.gsn !== quantity.gsn && onGsnChange) {
      console.log(`Changing GSN to ${quantity.gsn} for quantity ${quantity.quantity} ${quantity.uom}`);
      onGsnChange(quantity.gsn);
      
      // Automatically run the test if operation is provided
      if (currentOperation && onRunTest) {
        setTimeout(() => {
          onRunTest(currentOperation);
        }, 100); // Small delay to ensure form data is updated
      }
    }
  };
  
  return (
    <div className="mt-4 p-6 bg-white rounded-md border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Drug Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Brand/Generic Name */}
        <div className="col-span-2">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-3 w-16">Name:</span>
            {hasBothNames ? (
              <div className="flex items-center flex-grow">
                <button
                  onClick={() => setSelectedBrandType('brand')}
                  className={`px-3 py-1 text-xs rounded-l-md ${
                    selectedBrandType === 'brand' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Brand
                </button>
                <button
                  onClick={() => setSelectedBrandType('generic')}
                  className={`px-3 py-1 text-xs rounded-r-md ${
                    selectedBrandType === 'generic' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Generic
                </button>
                <span className="ml-3 text-blue-600 font-medium">
                  {selectedBrandType === 'brand' ? data.brandName : data.genericName}
                </span>
              </div>
            ) : (
              <span className="text-blue-600 font-medium">
                {data.brandName || data.genericName || 'No Data Available'}
              </span>
            )}
          </div>
        </div>
        
        {/* Forms */}
        <div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-3 w-16">Form:</span>
            <div className="flex-grow">
              {data.forms && data.forms.length > 0 ? (
                <select 
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
                  value={selectedForm?.form || ''}
                  onChange={(e) => {
                    const form = data.forms?.find(f => f.form === e.target.value) || null;
                    handleFormChange(form);
                  }}
                >
                  {data.forms.map((form, index) => (
                    <option key={index} value={form.form}>
                      {form.form}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-gray-500 italic">No Data Available</span>
              )}
              {selectedForm && (
                <div className="text-xs text-gray-500 mt-1">
                  GSN: {selectedForm.gsn}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Strengths */}
        <div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-3 w-16">Dosage:</span>
            <div className="flex-grow">
              {data.strengths && data.strengths.length > 0 ? (
                <select 
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
                  value={selectedStrength?.strength || ''}
                  onChange={(e) => {
                    const strength = data.strengths?.find(s => s.strength === e.target.value) || null;
                    handleStrengthChange(strength);
                  }}
                >
                  {data.strengths.map((strength, index) => (
                    <option key={index} value={strength.strength}>
                      {strength.strength}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-gray-500 italic">No Data Available</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Quantities */}
        <div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-3 w-16">Quantity:</span>
            <div className="flex-grow">
              {data.quantities && data.quantities.length > 0 ? (
                <select 
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
                  value={selectedQuantity ? `${selectedQuantity.quantity}-${selectedQuantity.uom}` : ''}
                  onChange={(e) => {
                    const [quantity, uom] = e.target.value.split('-');
                    const quantityObj = data.quantities?.find(
                      q => q.quantity === parseFloat(quantity) && q.uom === uom
                    ) || null;
                    handleQuantityChange(quantityObj);
                  }}
                >
                  {data.quantities.map((quantity, index) => (
                    <option key={index} value={`${quantity.quantity}-${quantity.uom}`}>
                      {quantity.quantity} {quantity.uom}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-gray-500 italic">No Data Available</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component for location selection
const LocationSelector = ({ 
  onLocationSelected 
}: { 
  onLocationSelected: (latitude: number, longitude: number) => void 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showZipForm, setShowZipForm] = useState(false);
  const [zipCode, setZipCode] = useState('');

  // Get browser location
  const getBrowserLocation = () => {
    setIsLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLoading(false);
        onLocationSelected(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setIsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('User denied the request for geolocation');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable');
            break;
          case error.TIMEOUT:
            setError('The request to get user location timed out');
            break;
          default:
            setError('An unknown error occurred');
            break;
        }
      }
    );
  };

  // Get location from ZIP code
  const getLocationFromZip = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!zipCode || zipCode.length < 5) {
      setError('Please enter a valid ZIP code');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Using the free Zippopotam.us API to convert ZIP to lat/long
      const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
      
      if (!response.ok) {
        throw new Error('ZIP code not found');
      }
      
      const data = await response.json();
      
      if (data && data.places && data.places[0]) {
        const latitude = parseFloat(data.places[0].latitude);
        const longitude = parseFloat(data.places[0].longitude);
        onLocationSelected(latitude, longitude);
      } else {
        throw new Error('Could not find coordinates for this ZIP code');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error fetching location data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
      <h3 className="text-lg font-semibold mb-3 text-blue-800">Location Selection</h3>
      
      {!showZipForm ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            To get accurate pricing information, we need your location. Choose how you'd like to provide it:
          </p>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={getBrowserLocation}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <span className="mr-2">Loading...</span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Use My Current Location
                </>
              )}
            </button>
            
            <button
              onClick={() => setShowZipForm(true)}
              disabled={isLoading}
              className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm disabled:opacity-50 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Enter ZIP Code
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <form onSubmit={getLocationFromZip} className="flex flex-wrap gap-2 items-end">
            <div className="flex-grow">
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.slice(0, 5))}
                placeholder="Enter 5-digit ZIP code"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                maxLength={5}
                pattern="[0-9]{5}"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Submit'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowZipForm(false)}
                disabled={isLoading}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm disabled:opacity-50"
              >
                Back
              </button>
            </div>
          </form>
        </div>
      )}
      
      {error && (
        <div className="mt-3 p-3 bg-red-100 text-red-800 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default function TestApiDetailsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Record<string, ApiTestResult>>({})
  const [activeTab, setActiveTab] = useState('drugInfo')
  const [formData, setFormData] = useState<FormDataType>({})
  const [expandedResults, setExpandedResults] = useState<string[]>([])
  const [testLog, setTestLog] = useState<string[]>([])
  const [showRawResponse, setShowRawResponse] = useState(false)
  
  // State for drug name lookup
  const [drugNameLookup, setDrugNameLookup] = useState<Record<string, string>>({})
  const [drugNameLoading, setDrugNameLoading] = useState<Record<string, boolean>>({})
  
  // State for API connection test
  const [connectionTestLoading, setConnectionTestLoading] = useState(false)
  const [connectionTestResults, setConnectionTestResults] = useState<ConnectionTestResult | null>(null)
  const [connectionTestError, setConnectionTestError] = useState<string | null>(null)
  
  // State for location selection
  const [locationSelected, setLocationSelected] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{latitude: number, longitude: number} | null>(null)

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
  
  // Fetch drug names for default GSN values
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      // Find all GSN fields with values
      Object.entries(formData).forEach(([operationId, fields]) => {
        if (fields.gsn && !drugNameLookup[fields.gsn]) {
          fetchDrugName(fields.gsn);
        }
      });
    }
  }, [formData]);

  const handleInputChange = (operationId: string, fieldName: string, value: any) => {
    setFormData(prev => {
      // Ensure the operation exists in the form data
      const currentOperationData = prev[operationId] || {};
      
      // If this is a GSN field and the value has changed, fetch the drug name
      if (fieldName === 'gsn' && value !== currentOperationData[fieldName]) {
        // Convert value to number to ensure consistent comparison
        const gsnNumber = typeof value === 'string' ? parseInt(value, 10) : value;
        if (!isNaN(gsnNumber)) {
          // Use setTimeout to ensure state update completes first
          setTimeout(() => fetchDrugName(gsnNumber), 0);
        }
      }
      
      return {
        ...prev,
        [operationId]: {
          ...currentOperationData,
          [fieldName]: value
        }
      };
    });
  }

  // Function to fetch drug name based on GSN
  const fetchDrugName = async (gsn: number | string) => {
    // Convert gsn to number if it's a string
    const gsnNumber = typeof gsn === 'string' ? parseInt(gsn, 10) : gsn;
    
    if (!gsnNumber || isNaN(gsnNumber)) {
      addToLog(`Cannot lookup drug name: No valid GSN provided`);
      return;
    }
    
    // Convert to string for use as object key
    const gsnKey = gsnNumber.toString();
    
    // If we already have this GSN in our lookup, don't fetch again unless it's an error or unknown
    if (drugNameLookup[gsnKey] && 
        drugNameLookup[gsnKey] !== 'Unknown Drug' && 
        drugNameLookup[gsnKey] !== 'Error fetching name') {
      return;
    }
    
    setDrugNameLoading(prev => ({ ...prev, [gsnKey]: true }));
    addToLog(`Looking up drug name for GSN ${gsnNumber}...`);
    
    try {
      // Try to get the drug name from our dedicated API endpoint
      const response = await fetch(`/api/drugs/name?gsn=${gsnNumber}`);
      const data = await response.json();
      
      if (response.ok && data.name) {
        setDrugNameLookup(prev => ({ ...prev, [gsnKey]: data.name }));
        addToLog(`Found drug name for GSN ${gsnNumber}: ${data.name}`);
        return;
      }
      
      // Handle case where API is working but GSN is invalid
      if (data.validApiConnection) {
        setDrugNameLookup(prev => ({ ...prev, [gsnKey]: 'Invalid GSN' }));
        addToLog(`${data.message || 'GSN appears to be invalid'}`);
        toast.error(`Invalid GSN: ${gsnNumber}. Try a different GSN number.`);
        return;
      }
      
      // If the dedicated endpoint fails, try the drug info endpoint directly
      const infoResponse = await fetch(`/api/drugs/info/gsn?gsn=${gsnNumber}`);
      
      if (infoResponse.ok) {
        const infoData = await infoResponse.json();
        
        // Try to extract drug name from various possible fields
        let drugName = '';
        if (infoData.data?.brandName) {
          drugName = infoData.data.brandName;
        } else if (infoData.data?.genericName) {
          drugName = infoData.data.genericName;
        } else if (infoData.data?.drugName) {
          drugName = infoData.data.drugName;
        } else if (infoData.data?.drugInfo?.brandName) {
          drugName = infoData.data.drugInfo.brandName;
        } else if (infoData.data?.drugInfo?.genericName) {
          drugName = infoData.data.drugInfo.genericName;
        }
        
        if (drugName) {
          setDrugNameLookup(prev => ({ ...prev, [gsnKey]: drugName }));
          addToLog(`Found drug name for GSN ${gsnNumber}: ${drugName}`);
          return;
        }
      }
      
      // If we still don't have a name, set a placeholder
      setDrugNameLookup(prev => ({ ...prev, [gsnKey]: 'Unknown Drug' }));
      addToLog(`Could not find drug name for GSN ${gsnNumber}. The GSN may be invalid or not in the database.`);
      
    } catch (error) {
      console.error('Error fetching drug name:', error);
      addToLog(`Error looking up drug name for GSN ${gsnNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setDrugNameLookup(prev => ({ ...prev, [gsnKey]: 'Error fetching name' }));
    } finally {
      setDrugNameLoading(prev => ({ ...prev, [gsnKey]: false }));
    }
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
        
        // If this is a drug info request and we have GSN, update the drug name
        if (operation.endpoint.includes('/api/drugs/info/gsn') && data.gsn) {
          const gsn = parseInt(data.gsn.toString());
          
          // Extract drug name from response
          let drugName = '';
          if (responseData.brandName) {
            drugName = responseData.brandName;
          } else if (responseData.genericName) {
            drugName = responseData.genericName;
          } else if (responseData.drugName) {
            drugName = responseData.drugName;
          }
          
          // Update drug name lookup if we found a name
          if (drugName && drugName !== '') {
            const gsnKey = gsn.toString();
            setDrugNameLookup(prev => ({ ...prev, [gsnKey]: drugName }));
            addToLog(`Updated drug name for GSN ${gsn}: ${drugName}`);
          }
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

  // Handle location selection
  const handleLocationSelected = (latitude: number, longitude: number) => {
    setSelectedLocation({ latitude, longitude });
    setLocationSelected(true);
    addToLog(`Location selected: Latitude ${latitude.toFixed(4)}, Longitude ${longitude.toFixed(4)}`);
    
    // Update all drug pricing operations with the new location
    const updatedFormData = { ...formData };
    
    // Update each operation in the drugPricing tab
    apiOperations.drugPricing?.forEach(operation => {
      const currentOperationData = updatedFormData[operation.id] || {};
      
      updatedFormData[operation.id] = {
        ...currentOperationData,
        latitude,
        longitude
      };
    });
    
    setFormData(updatedFormData);
  };

  // Reset location
  const resetLocation = () => {
    setSelectedLocation(null);
    setLocationSelected(false);
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
            onClick={() => {
              setActiveTab('drugPricing');
              // If location hasn't been selected yet, reset any previous results
              if (!locationSelected) {
                const drugPricingOperationIds = apiOperations.drugPricing?.map(op => op.id) || [];
                setResults(prev => {
                  const newResults = { ...prev };
                  drugPricingOperationIds.forEach(id => {
                    delete newResults[id];
                  });
                  return newResults;
                });
              }
            }}
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
                        <div className="bg-gray-900 p-3 rounded-md overflow-x-auto max-h-96 overflow-y-auto">
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
                        <div className="bg-gray-900 p-3 rounded-md overflow-x-auto max-h-96 overflow-y-auto">
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
                        <div className="bg-gray-900 p-3 rounded-md overflow-x-auto max-h-96 overflow-y-auto">
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
                  <div className="bg-gray-900 p-3 rounded-md overflow-x-auto max-h-96 overflow-y-auto">
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
          {/* Location Selector for Drug Pricing Tab */}
          {activeTab === 'drugPricing' && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Location Selection</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Select your location to get accurate drug pricing information
                    </p>
                  </div>
                  {locationSelected && (
                    <button
                      onClick={resetLocation}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm"
                    >
                      Reset Location
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-200">
                {locationSelected ? (
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-green-700 font-medium">Location Selected</p>
                    <p className="text-sm text-green-600">
                      Latitude: {selectedLocation?.latitude.toFixed(4)}, 
                      Longitude: {selectedLocation?.longitude.toFixed(4)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      All drug pricing operations will use this location
                    </p>
                  </div>
                ) : (
                  <LocationSelector onLocationSelected={handleLocationSelected} />
                )}
              </div>
            </div>
          )}
          
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
                    disabled={isLoading || (activeTab === 'drugPricing' && !locationSelected)}
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
                      
                      {/* Display drug name if this is a GSN field */}
                      {field.name === 'gsn' && formData[operation.id]?.[field.name] && (
                        <div className="mt-2">
                          {drugNameLoading[formData[operation.id]?.[field.name].toString()] ? (
                            <p className="text-sm text-blue-600">Looking up drug name...</p>
                          ) : drugNameLookup[formData[operation.id]?.[field.name].toString()] ? (
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-700 mr-2">Drug Name:</span>
                              <span className="text-sm text-blue-600">{drugNameLookup[formData[operation.id]?.[field.name].toString()]}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => fetchDrugName(formData[operation.id]?.[field.name])}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Lookup drug name
                            </button>
                          )}
                        </div>
                      )}
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

                      <div className="mt-2">
                        <div className="font-medium text-xs">Response:</div>
                        <div className="bg-gray-900 p-3 rounded-md overflow-x-auto max-h-96 overflow-y-auto">
                          <pre className="text-green-400 text-xs">
                            {showRawResponse 
                              ? results[operation.id].rawResponse || JSON.stringify(results[operation.id].data, null, 2)
                              : JSON.stringify(results[operation.id].data, null, 2)
                            }
                          </pre>
                        </div>
                      </div>

                      {/* Add Drug Info Details for drug info endpoint */}
                      {operation.endpoint.includes('/api/drugs/info/gsn') && results[operation.id]?.success && (
                        <DrugInfoDetails 
                          data={results[operation.id].data} 
                          onGsnChange={(gsn) => handleInputChange(operation.id, 'gsn', gsn)} 
                          currentOperation={operation}
                          onRunTest={runTest}
                        />
                      )}
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