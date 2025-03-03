'use client'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { getDrugInfo, getDrugPrices, getDetailedDrugInfo, searchMedications } from '@/services/medicationApi'
import LoadingState from '@/components/search/LoadingState'
import { DrugInfo as DrugInfoType, DrugDetails, PharmacyPrice, APIError, DrugSearchResponse } from '@/types/api'
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
  const [searchRadius, setSearchRadius] = useState<number>(50)
  const [userLocation, setUserLocation] = useState({
    latitude: 30.4015,
    longitude: -97.7527,
    zipCode: '78759'
  })
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false)
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyPrice | null>(null)
  const [showPrices, setShowPrices] = useState(true)
  const [isLoadingPharmacies, setIsLoadingPharmacies] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pharmaciesPerPage, setPharmaciesPerPage] = useState(5)

  // Create a ref for the pharmacy list
  const pharmacyListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Get coordinates from browser
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            
            // Get ZIP code from coordinates using reverse geocoding
            let zipCode = userLocation.zipCode; // Default
            
            try {
              // Use the Google Maps Geocoding API to get the ZIP code
              const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
              );
              
              if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                  // Extract ZIP code from address components
                  for (const result of data.results) {
                    for (const component of result.address_components) {
                      if (component.types.includes('postal_code')) {
                        zipCode = component.short_name;
                        break;
                      }
                    }
                    if (zipCode !== userLocation.zipCode) break;
                  }
                }
              }
            } catch (error) {
              console.error("Error getting ZIP code from coordinates:", error);
              // Keep existing ZIP code
            }
            
            // Update user location with coordinates and ZIP code
            const newLocation = {
              latitude,
              longitude,
              zipCode
            };
            
            setUserLocation(newLocation);
            
            // Fetch pharmacy prices with the new location
            await fetchPharmacyPrices(latitude, longitude, searchRadius);
          } catch (error) {
            console.error("Error processing user location:", error);
            // Keep default location
          }
        },
        (error) => {
          console.error("Error getting user location:", error);
          // Keep default location
        }
      );
    }
  }, [])

  // Function to fetch pharmacy prices
  const fetchPharmacyPrices = async (latitude: number, longitude: number, radius: number) => {
    try {
      setIsLoadingPharmacies(true)
      
      if (!drugInfo && !params.name) {
        console.error('Cannot fetch pharmacy prices: No drug info or name available')
        return
      }
      
      const drugName = drugInfo?.genericName || decodeURIComponent(params.name)
      const gsnToUse = drugInfo?.gsn || (gsn ? parseInt(gsn, 10) : undefined)
      
      console.log(`Fetching pharmacy prices for ${drugName} (GSN: ${gsnToUse || 'not available'})`)
      console.log(`Location: ${latitude}, ${longitude}, Radius: ${radius} miles`)
      
      // Prepare the request
      const request = {
        latitude,
        longitude,
        radius,
        customizedQuantity: false
      }
      
      // Add either GSN or drug name
      if (gsnToUse) {
        Object.assign(request, { gsn: gsnToUse })
      } else {
        Object.assign(request, { drugName })
      }
      
      // Add quantity if selected
      if (selectedQuantity) {
        const quantityMatch = selectedQuantity.match(/(\d+)/)
        if (quantityMatch && quantityMatch[1]) {
          const quantity = parseInt(quantityMatch[1], 10)
          if (!isNaN(quantity)) {
            Object.assign(request, { 
              customizedQuantity: true,
              quantity
            })
          }
        }
      }
      
      console.log('Pharmacy price request:', request)
      
      // Call the API
      const response = await getDrugPrices(request)
      console.log('Pharmacy price response:', response)
      
      if (response.pharmacies && response.pharmacies.length > 0) {
        // Sort pharmacies based on selected sort option
        let sortedPharmacies = [...response.pharmacies]
        
        if (selectedSort === 'PRICE') {
          sortedPharmacies.sort((a, b) => a.price - b.price)
        } else if (selectedSort === 'DISTANCE') {
          sortedPharmacies.sort((a, b) => {
            const distanceA = parseFloat(a.distance.replace(' mi', ''))
            const distanceB = parseFloat(b.distance.replace(' mi', ''))
            return distanceA - distanceB
          })
        }
        
        setPharmacyPrices(sortedPharmacies)
        console.log(`Found ${sortedPharmacies.length} pharmacies with prices`)
        
        // Set the first pharmacy as selected by default
        if (sortedPharmacies.length > 0 && !selectedPharmacy) {
          setSelectedPharmacy(sortedPharmacies[0])
        }
      } else {
        console.log('No pharmacy prices found')
        setPharmacyPrices([])
      }
    } catch (error) {
      console.error('Error fetching pharmacy prices:', error)
    } finally {
      setIsLoadingPharmacies(false)
    }
  }

  // Function to fetch drug information
  const fetchDrugInfo = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const drugName = decodeURIComponent(params.name)
      console.log(`Fetching drug info for: ${drugName}, GSN: ${gsn || 'not provided'}`)
      
      // If we have a GSN, use it to get detailed drug info
      if (gsn) {
        try {
          const gsnNumber = parseInt(gsn, 10)
          
          // Get detailed drug info using GSN
          const detailedInfo = await getDetailedDrugInfo(gsnNumber)
          console.log('Detailed drug info:', detailedInfo)
          
          // Get basic drug info
          const basicInfo = await getDrugInfo(drugName)
          console.log('Basic drug info:', basicInfo)
          
          // Combine the information
          setDrugInfo({
            brandName: detailedInfo.brandName || basicInfo.brandName || drugName,
            genericName: detailedInfo.genericName || basicInfo.genericName || drugName,
            gsn: gsnNumber,
            ndcCode: detailedInfo.ndcCode || '',
            description: detailedInfo.description || basicInfo.description || '',
            sideEffects: detailedInfo.sideEffects || basicInfo.sideEffects || '',
            dosage: detailedInfo.dosage || basicInfo.dosage || '',
            storage: detailedInfo.storage || basicInfo.storage || '',
            contraindications: detailedInfo.contraindications || basicInfo.contraindications || ''
          })
          
          setDrugDetails(basicInfo)
        } catch (error) {
          console.error('Error fetching detailed drug info:', error)
          
          // Fall back to basic drug info
          const basicInfo = await getDrugInfo(drugName)
          console.log('Basic drug info (fallback):', basicInfo)
          
          setDrugInfo({
            brandName: basicInfo.brandName || drugName,
            genericName: basicInfo.genericName || drugName,
            gsn: parseInt(gsn, 10),
            ndcCode: '',
            description: basicInfo.description || '',
            sideEffects: basicInfo.sideEffects || '',
            dosage: basicInfo.dosage || '',
            storage: basicInfo.storage || '',
            contraindications: basicInfo.contraindications || ''
          })
          
          setDrugDetails(basicInfo)
        }
      } else {
        // If we don't have a GSN, just get basic drug info
        const basicInfo = await getDrugInfo(drugName)
        console.log('Basic drug info:', basicInfo)
        
        // Try to find the drug in the search results to get a GSN
        const searchResults = await searchMedications(drugName)
        console.log('Search results:', searchResults)
        
        const matchingDrug = searchResults.find(
          drug => drug.drugName.toLowerCase() === drugName.toLowerCase()
        )
        
        const gsnFromSearch = matchingDrug?.gsn
        
        setDrugInfo({
          brandName: basicInfo.brandName || drugName,
          genericName: basicInfo.genericName || drugName,
          gsn: gsnFromSearch || 0,
          ndcCode: '',
          description: basicInfo.description || '',
          sideEffects: basicInfo.sideEffects || '',
          dosage: basicInfo.dosage || '',
          storage: basicInfo.storage || '',
          contraindications: basicInfo.contraindications || ''
        })
        
        setDrugDetails(basicInfo)
        
        // If we found a GSN, update the URL
        if (gsnFromSearch && typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          url.searchParams.set('gsn', gsnFromSearch.toString())
          window.history.replaceState({}, '', url.toString())
        }
      }
      
      // Fetch pharmacy prices
      await fetchPharmacyPrices(userLocation.latitude, userLocation.longitude, searchRadius)
    } catch (err) {
      console.error('Error fetching drug info:', err)
      setError('Failed to load drug information. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDrugInfo();
  }, [params.name, gsn, searchRadius, userLocation]);

  // Handle ZIP code change from the map component
  const handleZipCodeChange = async (newZipCode: string) => {
    try {
      console.log(`Handling ZIP code change to: ${newZipCode}`);
      setIsLoadingPharmacies(true);
      setError(null);
      setCurrentPage(1); // Reset to first page when ZIP code changes
      
      // Use our geocoding utility to get coordinates from ZIP code
      const { geocodeZipCode } = await import('@/utils/geocoding');
      const newLocation = await geocodeZipCode(newZipCode);
      
      console.log(`Geocoded ${newZipCode} to coordinates:`, newLocation);
      
      // Update user location
      setUserLocation(newLocation);
      
      // Fetch prices with new location
      await fetchPharmacyPrices(newLocation.latitude, newLocation.longitude, searchRadius);
    } catch (error) {
      console.error("Error updating location:", error);
      setError("Failed to update location. Please try a valid US ZIP code.");
    } finally {
      setIsLoadingPharmacies(false);
    }
  };

  // Handle radius change from the map component
  const handleRadiusChange = async (newRadius: number) => {
    try {
      console.log(`Handling radius change to: ${newRadius} miles`);
      setIsLoadingPharmacies(true);
      setError(null);
      setSearchRadius(newRadius);
      setCurrentPage(1); // Reset to first page when radius changes
      
      await fetchPharmacyPrices(userLocation.latitude, userLocation.longitude, newRadius);
    } catch (error) {
      console.error("Error updating search radius:", error);
      setError("Failed to update search radius. Please try again.");
    } finally {
      setIsLoadingPharmacies(false);
    }
  };

  // Format pharmacy data for the map
  const mapPharmacies = pharmacyPrices.map((pharmacy, index) => {
    // Extract distance value (assuming format like "0.8 miles")
    const distanceValue = parseFloat(pharmacy.distance?.split(' ')[0]) || 0;
    
    return {
      pharmacyId: index,
      name: pharmacy.name,
      address: pharmacy.address || `${index + 100} Main St`, // Use API address or fallback
      city: pharmacy.city || "Austin", // Use API city or fallback
      state: pharmacy.state || "TX", // Use API state or fallback
      postalCode: pharmacy.zipCode || userLocation.zipCode,
      phone: pharmacy.phone || `555-${100 + index}-${1000 + index}`,
      distance: distanceValue,
      latitude: pharmacy.latitude || (userLocation.latitude + (Math.sin(index) * 0.05)),
      longitude: pharmacy.longitude || (userLocation.longitude + (Math.cos(index) * 0.05)),
      price: pharmacy.price,
      open24H: pharmacy.open24H || index % 3 === 0, // Use API data or fallback
      driveUpWindow: pharmacy.driveUpWindow || index % 2 === 0, // Use API data or fallback
      handicapAccess: pharmacy.handicapAccess || true // Use API data or fallback
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

  // Handle search radius change from the dropdown
  const handleSearchRadiusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const radius = parseInt(value.split(' ')[0], 10);
    setCurrentPage(1); // Reset to first page when radius changes
    handleRadiusChange(radius);
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSort(e.target.value);
    setCurrentPage(1); // Reset to first page when sort changes
  };

  // Handle pharmacies per page change
  const handlePharmaciesPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      // Set to a large number to show all pharmacies
      setPharmaciesPerPage(1000);
    } else {
      setPharmaciesPerPage(parseInt(value, 10));
    }
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  // Function to handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    
    // Scroll to the top of the pharmacy list
    if (pharmacyListRef.current) {
      pharmacyListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                onChange={handleSortChange}
              >
                <option value="PRICE">PRICE</option>
                <option value="DISTANCE">DISTANCE</option>
                <option value="NAME">NAME</option>
              </select>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-gray-600 mr-2">SHOW:</span>
                <select 
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={pharmaciesPerPage === 1000 ? 'all' : pharmaciesPerPage.toString()}
                  onChange={handlePharmaciesPerPageChange}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="all">All</option>
                </select>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 mr-2">RADIUS:</span>
                <select 
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={`${searchRadius} MILES`}
                  onChange={handleSearchRadiusChange}
                >
                  <option value="5 MILES">5 MILES</option>
                  <option value="10 MILES">10 MILES</option>
                  <option value="25 MILES">25 MILES</option>
                  <option value="50 MILES">50 MILES</option>
                </select>
              </div>
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
              <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center" ref={pharmacyListRef}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#006142]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
                RESULTS FOR DRUG
              </h2>
              
              {isLoadingPharmacies ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006142]"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {pharmacyPrices.length > 0 ? (
                    <>
                      {/* Results count indicator */}
                      <div className="text-sm text-gray-600 mb-4">
                        Showing {Math.min((currentPage - 1) * pharmaciesPerPage + 1, pharmacyPrices.length)}-
                        {Math.min(currentPage * pharmaciesPerPage, pharmacyPrices.length)} of {pharmacyPrices.length} results
                      </div>
                      
                      {pharmacyPrices
                        .sort((a, b) => {
                          if (selectedSort === 'PRICE') return a.price - b.price;
                          if (selectedSort === 'DISTANCE') {
                            const distA = parseFloat(a.distance.split(' ')[0]) || 0;
                            const distB = parseFloat(b.distance.split(' ')[0]) || 0;
                            return distA - distB;
                          }
                          return a.name.localeCompare(b.name);
                        })
                        // Apply pagination
                        .slice((currentPage - 1) * pharmaciesPerPage, currentPage * pharmaciesPerPage)
                        .map((pharmacy, index) => {
                          // Calculate the actual index in the full sorted array for the badge
                          const actualIndex = pharmacyPrices
                            .sort((a, b) => {
                              if (selectedSort === 'PRICE') return a.price - b.price;
                              if (selectedSort === 'DISTANCE') {
                                const distA = parseFloat(a.distance.split(' ')[0]) || 0;
                                const distB = parseFloat(b.distance.split(' ')[0]) || 0;
                                return distA - distB;
                              }
                              return a.name.localeCompare(b.name);
                            })
                            .findIndex(p => p === pharmacy);
                            
                          return (
                            <motion.div 
                              key={index} 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 * index }}
                              className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center p-2 py-3">
                                <div className="flex-shrink-0 mr-3">
                                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#EFFDF6] text-[#006142] font-semibold text-sm">
                                    {actualIndex + 1}
                                  </div>
                                </div>
                                <div className="flex-grow">
                                  <h3 className="font-medium text-gray-900 text-sm">{pharmacy.name}</h3>
                                  <div className="flex items-center text-gray-600 text-xs">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    <span>{pharmacy.distance}</span>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  <p className="text-xl font-bold text-[#006142]">${pharmacy.price.toFixed(2)}</p>
                                  <p className="text-xs text-gray-500">with coupon</p>
                                </div>
                              </div>
                              <div className="bg-gray-50 p-2 flex justify-between items-center border-t border-gray-200">
                                {actualIndex === 0 && (
                                  <span className="text-xs font-semibold text-[#006142] px-2 py-0.5 bg-[#EFFDF6] rounded">
                                    BEST VALUE
                                  </span>
                                )}
                                <div className="flex-grow"></div>
                                <button 
                                  className="bg-[#006142] hover:bg-[#22A307] text-white font-bold py-1.5 px-3 text-sm rounded transition duration-300" 
                                  onClick={() => handleGetCoupon(pharmacy)}
                                >
                                  GET FREE COUPON
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                        
                      {/* Pagination Controls */}
                      {pharmacyPrices.length > pharmaciesPerPage && (
                        <div className="flex justify-center items-center mt-6 space-x-2">
                          <button
                            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded-md ${
                              currentPage === 1 
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                : 'bg-[#EFFDF6] text-[#006142] hover:bg-[#006142] hover:text-white'
                            } transition-colors`}
                            aria-label="Previous page"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          
                          {/* Page numbers - responsive approach */}
                          <div className="hidden md:flex space-x-2">
                            {Array.from({ length: Math.ceil(pharmacyPrices.length / pharmaciesPerPage) }).map((_, index) => {
                              // Show all pages if there are 7 or fewer
                              // Otherwise show first, last, current, and pages around current
                              const totalPages = Math.ceil(pharmacyPrices.length / pharmaciesPerPage);
                              const pageNum = index + 1;
                              
                              if (
                                totalPages <= 7 ||
                                pageNum === 1 ||
                                pageNum === totalPages ||
                                Math.abs(pageNum - currentPage) <= 1
                              ) {
                                return (
                                  <button
                                    key={index}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-8 h-8 rounded-md ${
                                      currentPage === pageNum
                                        ? 'bg-[#006142] text-white'
                                        : 'bg-[#EFFDF6] text-[#006142] hover:bg-[#006142] hover:text-white'
                                    } transition-colors`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              } else if (
                                (pageNum === 2 && currentPage > 3) ||
                                (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                              ) {
                                // Show ellipsis
                                return (
                                  <span key={index} className="w-8 flex items-center justify-center">
                                    ...
                                  </span>
                                );
                              }
                              
                              return null;
                            })}
                          </div>
                          
                          {/* Mobile pagination - just show current/total */}
                          <div className="md:hidden flex items-center">
                            <span className="text-sm text-gray-600">
                              Page {currentPage} of {Math.ceil(pharmacyPrices.length / pharmaciesPerPage)}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handlePageChange(Math.min(currentPage + 1, Math.ceil(pharmacyPrices.length / pharmaciesPerPage)))}
                            disabled={currentPage === Math.ceil(pharmacyPrices.length / pharmaciesPerPage)}
                            className={`px-3 py-1 rounded-md ${
                              currentPage === Math.ceil(pharmacyPrices.length / pharmaciesPerPage)
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-[#EFFDF6] text-[#006142] hover:bg-[#006142] hover:text-white'
                            } transition-colors`}
                            aria-label="Next page"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-600">No pharmacy prices available for this medication.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Map */}
            <div className="h-[600px] bg-gray-100 rounded-lg overflow-hidden shadow-md">
              {isLoadingPharmacies ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006142]"></div>
                  <p className="ml-3 text-gray-600">Loading pharmacy data...</p>
                </div>
              ) : mapPharmacies.length > 0 ? (
                <PharmacyMap 
                  pharmacies={mapPharmacies}
                  zipCode={userLocation.zipCode}
                  centerLat={userLocation.latitude}
                  centerLng={userLocation.longitude}
                  searchRadius={searchRadius}
                  onMarkerClick={(pharmacy) => {
                    // Find the corresponding pharmacy in our prices list
                    const matchedPharmacy = pharmacyPrices.find((p, idx) => idx === pharmacy.pharmacyId);
                    if (matchedPharmacy) {
                      // Open the coupon modal for this pharmacy
                      setSelectedPharmacy(matchedPharmacy);
                      setIsCouponModalOpen(true);
                    }
                  }}
                  onZipCodeChange={handleZipCodeChange}
                  onRadiusChange={handleRadiusChange}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-gray-600 mb-4">No pharmacies found in this area</p>
                  <button 
                    onClick={() => handleRadiusChange(Math.min(searchRadius + 25, 100))}
                    className="px-4 py-2 bg-[#006142] text-white rounded-md hover:bg-[#22A307] transition-colors"
                  >
                    Increase Search Radius
                  </button>
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