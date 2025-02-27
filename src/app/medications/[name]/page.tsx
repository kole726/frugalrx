'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getDrugDetailsByGsn, getDrugInfo, getDrugPrices } from '@/services/medicationApi'
import DrugInfo from '@/components/search/DrugInfo'
import LoadingState from '@/components/search/LoadingState'
import { DrugInfo as DrugInfoType, DrugDetails, PharmacyPrice, APIError } from '@/types/api'
import Link from 'next/link'
import { MapPinIcon, ArrowLeftIcon, ShieldCheckIcon, BeakerIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

// Mock data to use when API fails
const MOCK_DRUG_DATA = {
  amoxicillin: {
    brandName: "Amoxil",
    genericName: "Amoxicillin",
    description: "Amoxicillin is a penicillin antibiotic that fights bacteria. It is used to treat many different types of infection caused by bacteria, such as tonsillitis, bronchitis, pneumonia, and infections of the ear, nose, throat, skin, or urinary tract.",
    sideEffects: "Common side effects include nausea, vomiting, diarrhea, stomach pain, headache, rash, and allergic reactions.",
    dosage: "250mg, 500mg, 875mg tablets or capsules",
    storage: "Store at room temperature away from moisture, heat, and light.",
    contraindications: "Do not use if you are allergic to penicillin antibiotics."
  },
  lisinopril: {
    brandName: "Prinivil, Zestril",
    genericName: "Lisinopril",
    description: "Lisinopril is an ACE inhibitor that is used to treat high blood pressure (hypertension) in adults and children who are at least 6 years old. It is also used to treat heart failure in adults, or to improve survival after a heart attack.",
    sideEffects: "Common side effects include headache, dizziness, cough, and low blood pressure.",
    dosage: "5mg, 10mg, 20mg, 40mg tablets",
    storage: "Store at room temperature away from moisture and heat.",
    contraindications: "Do not use if you are pregnant or have a history of angioedema."
  },
  atorvastatin: {
    brandName: "Lipitor",
    genericName: "Atorvastatin",
    description: "Atorvastatin is used to lower blood levels of \"bad\" cholesterol (low-density lipoprotein, or LDL), to increase levels of \"good\" cholesterol (high-density lipoprotein, or HDL), and to lower triglycerides.",
    sideEffects: "Common side effects include joint pain, diarrhea, urinary tract infections, and muscle pain.",
    dosage: "10mg, 20mg, 40mg, 80mg tablets",
    storage: "Store at room temperature away from moisture and heat.",
    contraindications: "Do not use if you have liver disease or if you are pregnant."
  }
};

// Mock pharmacy prices
const MOCK_PHARMACY_PRICES: PharmacyPrice[] = [
  { name: "Walgreens", price: 12.99, distance: "0.8 miles" },
  { name: "CVS Pharmacy", price: 14.50, distance: "1.2 miles" },
  { name: "Walmart Pharmacy", price: 9.99, distance: "2.5 miles" },
  { name: "Rite Aid", price: 13.75, distance: "3.1 miles" },
  { name: "Target Pharmacy", price: 11.25, distance: "4.0 miles" }
];

interface Props {
  params: {
    name: string
  }
}

export default function MedicationPage({ params }: Props) {
  const searchParams = useSearchParams()
  const gsn = searchParams.get('gsn')
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drugInfo, setDrugInfo] = useState<DrugInfoType | null>(null)
  const [drugDetails, setDrugDetails] = useState<DrugDetails | null>(null)
  const [pharmacyPrices, setPharmacyPrices] = useState<PharmacyPrice[]>([])
  const [zipCode, setZipCode] = useState<string>('78701') // Default to Austin, TX
  const [usingMockData, setUsingMockData] = useState(false)

  useEffect(() => {
    const fetchDrugData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        setUsingMockData(false)

        const drugName = decodeURIComponent(params.name)
        
        // Try to fetch real data from API
        try {
          // If we have a GSN, fetch drug details directly
          if (gsn) {
            const details = await getDrugDetailsByGsn(parseInt(gsn, 10))
            setDrugDetails(details)
            
            // Create a drug info object from the details
            setDrugInfo({
              brandName: details.brandName,
              genericName: details.genericName,
              gsn: parseInt(gsn, 10),
              ndcCode: '',
              description: details.description,
              sideEffects: details.sideEffects,
              strength: details.dosage,
              storage: details.storage,
              manufacturer: details.contraindications
            })
          } else {
            // Otherwise, search for the drug by name
            const info = await getDrugInfo(drugName)
            setDrugDetails(info)
            
            // Create a drug info object from the details
            setDrugInfo({
              brandName: info.brandName,
              genericName: info.genericName,
              gsn: 0, // We don't have a GSN in this case
              ndcCode: '',
              description: info.description,
              sideEffects: info.sideEffects,
              strength: info.dosage,
              storage: info.storage,
              manufacturer: info.contraindications
            })
          }

          // Fetch pharmacy prices
          // Using geolocation if available, otherwise default to Austin, TX
          const defaultCoords = {
            latitude: 30.4015,
            longitude: -97.7527
          }

          // Try to get user's location if supported
          let userCoords = defaultCoords
          if (typeof navigator !== 'undefined' && navigator.geolocation) {
            try {
              const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  timeout: 5000,
                  maximumAge: 60000
                })
              })
              
              userCoords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              }
            } catch (error) {
              console.warn('Could not get user location, using default:', error)
            }
          }

          const pricesResponse = await getDrugPrices({
            drugName,
            latitude: userCoords.latitude,
            longitude: userCoords.longitude,
            radius: 10,
            maximumPharmacies: 20
          })

          if (pricesResponse && pricesResponse.pharmacies) {
            setPharmacyPrices(pricesResponse.pharmacies)
            
            // Update drug info with prices
            setDrugInfo(prevInfo => {
              if (!prevInfo) return null
              return {
                ...prevInfo,
                prices: pricesResponse.pharmacies
              }
            })
          }
        } catch (apiError) {
          console.error('API error, falling back to mock data:', apiError);
          
          // Fall back to mock data if API fails
          setUsingMockData(true)
          
          // Convert drug name to lowercase for matching
          const drugNameLower = drugName.toLowerCase();
          
          // Find a matching mock drug or use a default
          let mockDrug = null;
          if (drugNameLower.includes('amoxicillin')) {
            mockDrug = MOCK_DRUG_DATA.amoxicillin;
          } else if (drugNameLower.includes('lisinopril')) {
            mockDrug = MOCK_DRUG_DATA.lisinopril;
          } else if (drugNameLower.includes('atorvastatin') || drugNameLower.includes('lipitor')) {
            mockDrug = MOCK_DRUG_DATA.atorvastatin;
          } else {
            // Use amoxicillin as default mock data
            mockDrug = MOCK_DRUG_DATA.amoxicillin;
          }
          
          // Set mock drug info
          setDrugInfo({
            brandName: mockDrug.brandName,
            genericName: mockDrug.genericName,
            gsn: 0,
            ndcCode: '',
            description: mockDrug.description,
            sideEffects: mockDrug.sideEffects,
            strength: mockDrug.dosage,
            storage: mockDrug.storage,
            manufacturer: mockDrug.contraindications,
            prices: MOCK_PHARMACY_PRICES
          });
          
          // Set mock pharmacy prices
          setPharmacyPrices(MOCK_PHARMACY_PRICES);
        }
      } catch (error: unknown) {
        const apiError = error as APIError;
        setError(apiError.message || 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDrugData()
  }, [params.name, gsn])

  const handleZipCodeSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!zipCode || !drugInfo) return
    
    try {
      setIsLoading(true)
      
      if (usingMockData) {
        // If using mock data, just simulate a delay and return mock prices
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPharmacyPrices(MOCK_PHARMACY_PRICES);
      } else {
        // Default coordinates for the entered ZIP code
        // In a real app, you would use a geocoding service here
        const defaultCoords = {
          latitude: 30.4015,
          longitude: -97.7527
        }
        
        const pricesResponse = await getDrugPrices({
          drugName: drugInfo.genericName || drugInfo.brandName,
          latitude: defaultCoords.latitude,
          longitude: defaultCoords.longitude,
          radius: 10,
          maximumPharmacies: 20
        })
        
        if (pricesResponse && pricesResponse.pharmacies) {
          setPharmacyPrices(pricesResponse.pharmacies)
          
          // Update drug info with prices
          setDrugInfo(prevInfo => {
            if (!prevInfo) return null
            return {
              ...prevInfo,
              prices: pricesResponse.pharmacies
            }
          })
        }
      }
    } catch (error) {
      console.error('Error fetching prices by ZIP code:', error)
      // Fall back to mock data
      setPharmacyPrices(MOCK_PHARMACY_PRICES);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-red-700 mb-3">Error Loading Medication Information</h2>
            <p className="text-red-600">{error}</p>
            <Link 
              href="/"
              className="mt-6 inline-block text-red-700 hover:text-red-800 font-medium"
            >
              ← Back to Search
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Header with back button */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <Link 
                href="/"
                className="text-[#006B52] hover:text-[#004D3A] font-medium flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </div>
          </div>
          
          {/* Mock data warning */}
          {usingMockData && (
            <div className="bg-amber-50 border-b border-amber-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center text-amber-800">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p className="text-sm">
                    <strong>Note:</strong> Using sample data for demonstration purposes. API connection unavailable.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Drug title section */}
          <div className="bg-white border-b border-gray-200 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#2C3E50]">
                {drugInfo?.brandName || drugInfo?.genericName}
              </h1>
              {drugInfo?.brandName && drugInfo?.genericName && drugInfo.brandName !== drugInfo.genericName && (
                <p className="text-lg text-gray-600 mt-2">Generic: {drugInfo.genericName}</p>
              )}
              
              {/* Quick info pills */}
              <div className="flex flex-wrap gap-4 mt-6">
                {drugInfo?.strength && (
                  <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full flex items-center">
                    <BeakerIcon className="h-4 w-4 mr-2" />
                    <span>{drugInfo.strength}</span>
                  </div>
                )}
                {drugInfo?.storage && (
                  <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span>Storage Instructions Available</span>
                  </div>
                )}
                {drugInfo?.sideEffects && (
                  <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-full flex items-center">
                    <ShieldCheckIcon className="h-4 w-4 mr-2" />
                    <span>Side Effects Listed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main content - Drug information */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description section */}
                {drugInfo?.description && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-[#2C3E50] mb-4">Description</h2>
                    <p className="text-gray-700">{drugInfo.description}</p>
                  </div>
                )}
                
                {/* Dosage section */}
                {drugInfo?.strength && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-[#2C3E50] mb-4">Dosage Information</h2>
                    <p className="text-gray-700">{drugInfo.strength}</p>
                  </div>
                )}
                
                {/* Side effects section */}
                {drugInfo?.sideEffects && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-[#2C3E50] mb-4">Side Effects</h2>
                    <p className="text-gray-700">{drugInfo.sideEffects}</p>
                  </div>
                )}
                
                {/* Storage instructions section */}
                {drugInfo?.storage && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-[#2C3E50] mb-4">Storage Instructions</h2>
                    <p className="text-gray-700">{drugInfo.storage}</p>
                  </div>
                )}
                
                {/* Disclaimer */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Disclaimer:</strong> This information is for educational purposes only and is not intended as medical advice. 
                    Always consult with a healthcare professional before starting or changing any medication.
                  </p>
                </div>
              </div>
              
              {/* Sidebar - Pharmacy prices */}
              <div className="lg:col-span-1 space-y-6">
                {/* Savings card */}
                <div className="bg-gradient-to-r from-[#006B52] to-[#008562] rounded-lg shadow-sm p-6 text-white">
                  <h2 className="text-xl font-semibold mb-3">Save on {drugInfo?.brandName || drugInfo?.genericName}</h2>
                  <p className="mb-4">Use our free prescription savings card to get the best price at pharmacies near you.</p>
                  <button className="w-full bg-white text-[#006B52] py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                    Download Savings Card
                  </button>
                </div>
                
                {/* ZIP code search */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-[#2C3E50] mb-4">Find Local Prices</h2>
                  <form onSubmit={handleZipCodeSearch} className="mb-4">
                    <div className="flex">
                      <div className="relative flex-grow">
                        <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Enter ZIP Code"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#006B52] focus:border-transparent"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          pattern="[0-9]{5}"
                          title="Five digit ZIP code"
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-[#006B52] text-white px-4 py-2 rounded-r-lg hover:bg-[#005743] transition-colors"
                      >
                        Search
                      </button>
                    </div>
                  </form>
                  
                  {/* Pharmacy prices list */}
                  {pharmacyPrices.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Pharmacy Prices</h3>
                      {pharmacyPrices.slice(0, 5).map((pharmacy, index) => (
                        <div key={index} className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{pharmacy.name}</p>
                              <p className="text-sm text-gray-500">{pharmacy.distance}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-[#006B52]">${pharmacy.price.toFixed(2)}</p>
                              <p className="text-xs text-gray-500">with card</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {pharmacyPrices.length > 5 && (
                        <button className="w-full text-[#006B52] font-medium py-2 border border-[#006B52] rounded-lg hover:bg-[#006B52]/5 transition-colors mt-2">
                          View All {pharmacyPrices.length} Pharmacies
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No pharmacy prices available for this location.</p>
                    </div>
                  )}
                </div>
                
                {/* Additional resources */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-[#2C3E50] mb-4">Additional Resources</h2>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-[#006B52] hover:underline">How to Save on Prescriptions</a>
                    </li>
                    <li>
                      <a href="#" className="text-[#006B52] hover:underline">Medication Safety Tips</a>
                    </li>
                    <li>
                      <a href="#" className="text-[#006B52] hover:underline">Find a Pharmacy Near You</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 