'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getDrugDetailsByGsn, getDrugInfo, getDrugPrices } from '@/services/medicationApi'
import LoadingState from '@/components/search/LoadingState'
import { DrugInfo as DrugInfoType, DrugDetails, PharmacyPrice, APIError } from '@/types/api'
import PharmacyMap from '@/components/maps/PharmacyMap'
import Link from 'next/link'
import Image from 'next/image'
import CouponModal from '@/components/CouponModal'
import MedicationAlternatives from '@/components/medications/alternatives/MedicationAlternatives'
import { motion } from 'framer-motion'

interface Props {
  params: {
    name: string
  }
}

export default function DrugPage({ params }: Props) {
  const searchParams = useSearchParams()
  const gsn = searchParams.get('gsn')
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drugInfo, setDrugInfo] = useState<DrugInfoType | null>(null)
  const [drugDetails, setDrugDetails] = useState<DrugDetails | null>(null)
  const [pharmacyPrices, setPharmacyPrices] = useState<PharmacyPrice[]>([])
  const [selectedForm, setSelectedForm] = useState<string>('CAPSULE')
  const [selectedStrength, setSelectedStrength] = useState<string>('500 mg')
  const [selectedQuantity, setSelectedQuantity] = useState<string>('21 CAPSULE')
  const [selectedSort, setSelectedSort] = useState<string>('PRICE')
  const [searchRadius, setSearchRadius] = useState<string>('50 MILES')
  const [userLocation, setUserLocation] = useState({
    latitude: 30.4015,
    longitude: -97.7527,
    zipCode: '78759'
  })
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false)
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyPrice | null>(null)
  const [showPrices, setShowPrices] = useState(true)

  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            zipCode: userLocation.zipCode // Keep the existing zip code for now
          })
        },
        (error) => {
          console.error("Error getting user location:", error)
          // Keep default location
        }
      )
    }
  }, [])

  useEffect(() => {
    const fetchDrugData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const drugName = decodeURIComponent(params.name)
        
        // If we have a GSN, fetch drug details directly
        if (gsn) {
          const details = await getDrugDetailsByGsn(parseInt(gsn, 10))
          setDrugDetails(details)
          
          // Create a basic drug info object from the details
          setDrugInfo({
            brandName: details.brandName,
            genericName: details.genericName,
            gsn: parseInt(gsn, 10),
            ndcCode: '',
            description: details.description,
            sideEffects: details.sideEffects,
            dosage: details.dosage,
            storage: details.storage,
            contraindications: details.contraindications
          })
        } else {
          // Otherwise, search for the drug by name
          const info = await getDrugInfo(drugName)
          setDrugDetails(info)
          
          // Create a basic drug info object from the details
          setDrugInfo({
            brandName: info.brandName,
            genericName: info.genericName,
            gsn: 0, // We don't have a GSN in this case
            ndcCode: '',
            description: info.description,
            sideEffects: info.sideEffects,
            dosage: info.dosage,
            storage: info.storage,
            contraindications: info.contraindications
          })
        }

        // Fetch pharmacy prices
        const pricesResponse = await getDrugPrices({
          drugName,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: parseInt(searchRadius, 10)
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
      } catch (error: unknown) {
        const apiError = error as APIError;
        setError(apiError.message || 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDrugData()
  }, [params.name, gsn, userLocation.latitude, userLocation.longitude, searchRadius])

  // Format pharmacy data for the map
  const mapPharmacies = pharmacyPrices.map((pharmacy, index) => {
    // Extract distance value (assuming format like "0.8 miles")
    const distanceValue = parseFloat(pharmacy.distance.split(' ')[0]) || 0;
    
    // Generate random but consistent coordinates around the user's location
    // In a real app, these would come from the API
    const seed = pharmacy.name.length; // Use name length as a simple seed
    const latOffset = (Math.sin(seed * 0.1) * 0.02);
    const lngOffset = (Math.cos(seed * 0.1) * 0.02);
    
    return {
      pharmacyId: index,
      name: pharmacy.name,
      address: `${index + 100} Main St`, // Placeholder - would come from API
      city: "Austin", // Placeholder
      state: "TX", // Placeholder
      postalCode: userLocation.zipCode,
      phone: pharmacy.name.length > 8 ? "555-123-4567" : undefined, // Some pharmacies might not have phone numbers
      distance: distanceValue,
      latitude: userLocation.latitude + latOffset,
      longitude: userLocation.longitude + lngOffset,
      price: pharmacy.price,
      open24H: index % 3 === 0, // Every 3rd pharmacy is open 24 hours (for demo)
      driveUpWindow: index % 2 === 0, // Every 2nd pharmacy has drive-up (for demo)
      handicapAccess: true // All pharmacies have handicap access (for demo)
    }
  });

  // Function to handle opening the coupon modal
  const handleGetCoupon = (pharmacy: PharmacyPrice) => {
    setSelectedPharmacy(pharmacy)
    setIsCouponModalOpen(true)
  }

  // Add a function to scroll to the alternatives section
  const scrollToAlternatives = () => {
    const alternativesSection = document.getElementById('alternatives-section');
    if (alternativesSection) {
      alternativesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Drug Information</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-4 text-red-700 hover:text-red-800 font-medium"
          >
            ← Back to Search
          </button>
        </div>
      ) : (
        <>
          {/* Breadcrumb Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <Link href="/" className="hover:text-[#006142]">Home</Link>
              <span className="mx-2">›</span>
              <Link href="/search" className="hover:text-[#006142]">Find Your Medications</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-700">{drugInfo?.brandName || params.name}</span>
            </div>
          </motion.div>

          {/* Medication Title */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {drugInfo?.genericName} Coupon
            </h1>
            <p className="text-gray-600">
              Pricing is displayed for {drugInfo?.genericName || 'generic medication'}
            </p>
          </motion.div>

          {/* Medication Form Selectors */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={drugInfo?.genericName || ''}
                onChange={(e) => {/* Would navigate to new drug */}}
              >
                <option value={drugInfo?.genericName || ''}>{drugInfo?.genericName || 'Select medication'}</option>
              </select>
            </div>
            <div>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
              >
                <option value="CAPSULE">CAPSULE</option>
                <option value="TABLET">TABLET</option>
                <option value="LIQUID">LIQUID</option>
              </select>
            </div>
            <div>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedStrength}
                onChange={(e) => setSelectedStrength(e.target.value)}
              >
                <option value="500 mg">500 mg</option>
                <option value="250 mg">250 mg</option>
                <option value="125 mg">125 mg</option>
              </select>
            </div>
            <div>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(e.target.value)}
              >
                <option value="21 CAPSULE">21 CAPSULE</option>
                <option value="30 CAPSULE">30 CAPSULE</option>
                <option value="60 CAPSULE">60 CAPSULE</option>
              </select>
            </div>
          </motion.div>

          {/* Location Selector */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-[#006142] text-white p-4 rounded-md mb-8 flex items-center justify-between shadow-md"
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{userLocation.zipCode || 'Location not set'}</span>
            </div>
            <button
              onClick={() => setShowPrices(!showPrices)}
              className="flex items-center bg-white text-[#006142] px-3 py-1 rounded-full font-medium text-sm hover:bg-[#EFFDF6] transition-colors"
            >
              {showPrices ? (
                <>
                  <span>Hide Prices</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </>
              ) : (
                <>
                  <span>Show Prices</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </motion.div>

          {/* Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="border-b border-gray-200 mb-6"
          >
            <div className="flex">
              <button className="py-2 px-4 border-b-2 border-[#006142] text-[#006142] font-medium">
                PRICES
              </button>
              <button className="py-2 px-4 text-gray-500 hover:text-gray-700">
                FAVORITE PHARMACY
              </button>
            </div>
          </motion.div>

          {/* Sort and Filter Options */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="flex flex-wrap justify-between items-center mb-6"
          >
            <div className="flex items-center mb-4 md:mb-0">
              <span className="text-gray-600 mr-2">SORT:</span>
              <select 
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
              >
                <option value="PRICE">PRICE</option>
                <option value="DISTANCE">DISTANCE</option>
                <option value="NAME">NAME</option>
              </select>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">SEARCH RADIUS:</span>
              <select 
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchRadius}
                onChange={(e) => setSearchRadius(e.target.value)}
              >
                <option value="5 MILES">5 MILES</option>
                <option value="10 MILES">10 MILES</option>
                <option value="25 MILES">25 MILES</option>
                <option value="50 MILES">50 MILES</option>
              </select>
            </div>
          </motion.div>

          {/* Main Content - Prices and Map */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Pharmacy Prices */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#006142]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
                RESULTS FOR DRUG
              </h2>
              <div className="space-y-4">
                {pharmacyPrices.length > 0 ? (
                  pharmacyPrices
                    .sort((a, b) => {
                      if (selectedSort === 'PRICE') return a.price - b.price;
                      if (selectedSort === 'DISTANCE') {
                        const distA = parseFloat(a.distance.split(' ')[0]) || 0;
                        const distB = parseFloat(b.distance.split(' ')[0]) || 0;
                        return distA - distB;
                      }
                      return a.name.localeCompare(b.name);
                    })
                    .map((pharmacy, index) => (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center p-4">
                          <div className="flex-shrink-0 mr-4">
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#EFFDF6] text-[#006142] font-semibold">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-medium text-gray-900">{pharmacy.name}</h3>
                            <div className="flex items-center text-gray-600 mb-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              <span>{pharmacy.distance}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-2xl font-bold text-[#006142]">${pharmacy.price.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">with coupon</p>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 flex justify-between items-center border-t border-gray-200">
                          {index === 0 && (
                            <span className="text-xs font-semibold text-[#006142] px-2 py-1 bg-[#EFFDF6] rounded">
                              BEST VALUE
                            </span>
                          )}
                          <div className="flex-grow"></div>
                          <button 
                            className="bg-[#006142] hover:bg-[#22A307] text-white font-bold py-2 px-4 rounded transition duration-300" 
                            onClick={() => handleGetCoupon(pharmacy)}
                          >
                            GET FREE COUPON
                          </button>
                        </div>
                      </motion.div>
                    ))
                ) : (
                  <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-600">No pharmacy prices available for this medication.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Map */}
            <div className="h-[500px] bg-gray-100 rounded-lg overflow-hidden shadow-md">
              {mapPharmacies.length > 0 ? (
                <PharmacyMap 
                  pharmacies={mapPharmacies}
                  zipCode={userLocation.zipCode}
                  centerLat={userLocation.latitude}
                  centerLng={userLocation.longitude}
                  onMarkerClick={(pharmacy) => {
                    // Find the corresponding pharmacy in our prices list
                    const matchedPharmacy = pharmacyPrices.find((p, idx) => idx === pharmacy.pharmacyId);
                    if (matchedPharmacy) {
                      // Open the coupon modal for this pharmacy
                      setSelectedPharmacy(matchedPharmacy);
                      setIsCouponModalOpen(true);
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-600">Map data not available</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Drug Information Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-12"
          >
            <button className="flex items-center justify-between w-full p-4 bg-[#006142] text-white rounded-t-lg shadow-md">
              <span className="font-medium">{drugInfo?.genericName?.toUpperCase()} DRUG INFORMATION</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="p-6 border border-gray-200 rounded-b-lg shadow-md bg-white">
              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Description</h3>
                <p className="mb-4 text-gray-700">{drugInfo?.description || 'No description available.'}</p>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Side Effects</h3>
                <p className="mb-4 text-gray-700">{drugInfo?.sideEffects || 'No side effects information available.'}</p>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Dosage</h3>
                <p className="mb-4 text-gray-700">{drugInfo?.dosage || 'No dosage information available.'}</p>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Storage</h3>
                <p className="mb-4 text-gray-700">{drugInfo?.storage || 'No storage information available.'}</p>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Contraindications</h3>
                <p className="mb-4 text-gray-700">{drugInfo?.contraindications || 'No contraindication information available.'}</p>
              </div>
            </div>

            {/* Add buttons for alternatives and comparison */}
            <div className="mt-4 flex flex-wrap gap-4">
              <button
                onClick={scrollToAlternatives}
                className="text-[#006142] hover:text-[#22A307] font-medium underline"
              >
                Find Alternatives
              </button>
              
              <Link 
                href={`/medications/compare?initial=${encodeURIComponent(drugInfo?.genericName || drugInfo?.brandName || '')}`}
                className="px-4 py-2 bg-[#006142] text-white rounded-md hover:bg-[#22A307] transition-colors text-sm flex items-center shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Compare With Others
              </Link>
            </div>
          </motion.div>

          {/* Savings Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="bg-[#EFFDF6] rounded-lg p-6 shadow-md mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-[#EFFDF6] p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#006142]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Save on Your Prescription</h3>
                  <p className="text-gray-600">Use our free coupon to save up to 80%</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#22A307] mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Treats {drugInfo?.description?.split('.')[0]}</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#22A307] mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Available as {drugInfo?.genericName} (generic) and {drugInfo?.brandName} (brand)</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#22A307] mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Save up to 80% with FrugalRx coupons</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-[#EFFDF6] rounded-lg p-6 shadow-md mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-[#EFFDF6] p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#006142]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Frequently Asked Questions</h3>
                  <p className="text-gray-600">Common questions about our savings program</p>
                </div>
              </div>
              <div className="space-y-4 mt-4">
                <div className="border-b border-gray-200 pb-4">
                  <button className="flex justify-between items-center w-full text-left">
                    <span className="font-medium text-gray-800">How does the FrugalRx prescription savings program work?</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-4 text-center">
                <button className="text-[#006142] font-medium flex items-center justify-center mx-auto hover:text-[#22A307] transition-colors">
                  VIEW ALL FAQS
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Related Articles Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mt-12 bg-gradient-to-br from-[#EFFDF6] to-white p-8 rounded-lg shadow-md"
          >
            <div className="text-center mb-8">
              <span className="text-[#006142] text-sm font-medium uppercase">OUR BLOG</span>
              <h2 className="text-2xl font-bold text-gray-800 mt-2">Know before you go.</h2>
              <p className="text-gray-600 mt-2">
                Want to be a more informed consumer? Visit FrugalRx blog, and find out what you should know.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1.0 }}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gray-200 relative">
                  <div className="absolute inset-0 bg-[#006142] opacity-10"></div>
                </div>
                <div className="p-4">
                  <span className="text-xs text-gray-500 uppercase">DRUG INTERACTIONS</span>
                  <h3 className="text-lg font-semibold mt-1 text-gray-800">Can You Take Tylenol and Ibuprofen Together?</h3>
                  <button className="text-[#006142] mt-4 font-medium hover:text-[#22A307] transition-colors">READ →</button>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1.1 }}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gray-200 relative">
                  <div className="absolute inset-0 bg-[#006142] opacity-10"></div>
                </div>
                <div className="p-4">
                  <span className="text-xs text-gray-500 uppercase">DRUG INFORMATION</span>
                  <h3 className="text-lg font-semibold mt-1 text-gray-800">Blood Clots and How to Treat Them</h3>
                  <button className="text-[#006142] mt-4 font-medium hover:text-[#22A307] transition-colors">READ →</button>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1.2 }}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gray-200 relative">
                  <div className="absolute inset-0 bg-[#006142] opacity-10"></div>
                </div>
                <div className="p-4">
                  <span className="text-xs text-gray-500 uppercase">DRUG INFORMATION</span>
                  <h3 className="text-lg font-semibold mt-1 text-gray-800">Ozempic for Weight Loss: What You Need to Know</h3>
                  <button className="text-[#006142] mt-4 font-medium hover:text-[#22A307] transition-colors">READ →</button>
                </div>
              </motion.div>
            </div>
            
            <div className="mt-8 text-center">
              <button className="bg-[#006142] text-white px-6 py-2 rounded-md font-medium hover:bg-[#22A307] transition-colors shadow-sm">
                VIEW ALL
              </button>
            </div>
          </motion.div>

          {/* Add an id to the alternatives section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.3 }}
            id="alternatives-section" 
            className="mt-12 mb-4 flex justify-between items-center"
          >
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#006142]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Alternative Medications
            </h2>
            <Link 
              href={`/medications/compare?initial=${encodeURIComponent(drugInfo?.genericName || drugInfo?.brandName || '')}`}
              className="px-4 py-2 bg-[#006142] text-white rounded-md hover:bg-[#22A307] transition-colors text-sm flex items-center shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Compare With Others
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.4 }}
          >
            <MedicationAlternatives 
              medicationId={drugInfo?.gsn?.toString() || ''}
              medicationName={drugInfo?.genericName || drugInfo?.brandName || ''}
            />
          </motion.div>

          {/* Coupon Modal */}
          {isCouponModalOpen && selectedPharmacy && (
            <CouponModal
              isOpen={isCouponModalOpen}
              onClose={() => setIsCouponModalOpen(false)}
              drugName={drugInfo?.brandName || drugInfo?.genericName || 'Medication'}
              pharmacy={selectedPharmacy}
              price={selectedPharmacy.price ? selectedPharmacy.price.toFixed(2) : undefined}
            />
          )}
        </>
      )}
    </div>
  )
} 