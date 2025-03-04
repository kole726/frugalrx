'use client'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { getDrugInfo, getDrugPrices, getDetailedDrugInfo, searchMedications } from '@/services/medicationApi'
import LoadingState from '@/components/search/LoadingState'
import { DrugInfo as DrugInfoType, DrugDetails, PharmacyPrice, APIError, DrugSearchResponse, DrugPriceResponse } from '@/types/api'
import PharmacyMap from '@/components/maps/PharmacyMap'
import Link from 'next/link'
import Image from 'next/image'
import CouponModal from '@/components/CouponModal'
import MedicationAlternatives from '@/components/medications/alternatives/MedicationAlternatives'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

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
  const [brandVariations, setBrandVariations] = useState<any[]>([])
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
  const [selectedBrand, setSelectedBrand] = useState<any | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pharmaciesPerPage, setPharmaciesPerPage] = useState(5)

  // Calculate total pages for pagination
  const totalPages = Math.ceil(pharmacyPrices.length / pharmaciesPerPage)

  // Create a ref for the pharmacy list
  const pharmacyListRef = useRef<HTMLDivElement>(null);

  // Function to get user's location
  const getUserLocation = async () => {
    setIsLoadingPharmacies(true);
    
    try {
      console.log("Attempting to get user location...");
      
      if (navigator.geolocation) {
        // Add a timeout for geolocation request
        const locationPromise = new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            (error) => {
              console.error('Geolocation error:', error.code, error.message);
              reject(error);
            },
            { 
              enableHighAccuracy: true, 
              timeout: 10000, 
              maximumAge: 0 
            }
          );
        });
        
        try {
          const position = await locationPromise as GeolocationPosition;
          const { latitude, longitude } = position.coords;
          console.log(`Got user location: ${latitude}, ${longitude}`);
          
          // Try to get ZIP code from coordinates
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            );
            
            const data = await response.json();
            console.log("Geocoding API response:", data);
            
            if (data.results && data.results.length > 0) {
              let zipCode = userLocation.zipCode; // Default
              
              // Look for postal code in the address components
              for (const result of data.results) {
                for (const component of result.address_components) {
                  if (component.types.includes('postal_code')) {
                    zipCode = component.short_name;
                    break;
                  }
                }
                if (zipCode !== userLocation.zipCode) break;
              }
              
              console.log(`Resolved ZIP code from coordinates: ${zipCode}`);
              
              // Update user location with coordinates and ZIP code
              const newLocation = {
                latitude,
                longitude,
                zipCode
              };
              
              console.log("Setting new user location:", newLocation);
              setUserLocation(newLocation);
              
              // Fetch pharmacy prices with the new location
              await fetchPharmacyPrices(latitude, longitude, searchRadius);
            } else {
              console.warn("No results from geocoding API");
              // Fallback to using coordinates only
              setUserLocation({
                latitude,
                longitude,
                zipCode: userLocation.zipCode // Keep the existing ZIP code
              });
              
              // Fetch pharmacy prices with the new location
              await fetchPharmacyPrices(latitude, longitude, searchRadius);
            }
          } catch (error) {
            console.error('Error getting ZIP code from coordinates:', error);
            
            // Fallback to using coordinates only
            const newLocation = {
              latitude,
              longitude,
              zipCode: userLocation.zipCode // Keep the existing ZIP code
            };
            
            console.log("Setting fallback user location:", newLocation);
            setUserLocation(newLocation);
            
            // Fetch pharmacy prices with the new location
            await fetchPharmacyPrices(latitude, longitude, searchRadius);
          }
        } catch (error) {
          console.error('Geolocation permission denied or timeout:', error);
          setError('Could not get your location. Please check your browser settings or enter your ZIP code manually.');
          setIsLoadingPharmacies(false);
          
          // Use default location
          console.log("Using default location");
          await fetchPharmacyPrices(userLocation.latitude, userLocation.longitude, searchRadius);
        }
      } else {
        console.error('Geolocation is not supported by this browser.');
        setError('Geolocation is not supported by your browser. Please enter your ZIP code manually.');
        setIsLoadingPharmacies(false);
        
        // Use default location
        console.log("Using default location - geolocation not supported");
        await fetchPharmacyPrices(userLocation.latitude, userLocation.longitude, searchRadius);
      }
    } catch (error) {
      console.error('Error in getUserLocation:', error);
      setError('An error occurred while trying to get your location. Please enter your ZIP code manually.');
      setIsLoadingPharmacies(false);
      
      // Use default location
      console.log("Using default location due to error");
      await fetchPharmacyPrices(userLocation.latitude, userLocation.longitude, searchRadius);
    }
  };

  useEffect(() => {
    // Debug loading state
    console.log('Initial component mount - isLoading:', isLoading);
    
    // Force update after a timeout if still loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log('Still loading after timeout, forcing update');
        setIsLoading(false);
        
        // If we don't have pharmacy prices by now, add mock data
        if (pharmacyPrices.length === 0) {
          console.log('No pharmacy prices after timeout, adding mock data');
          
          // Add mock pharmacy prices
          const mockPharmacies = [
            {
              name: 'Walgreens',
              price: 12.99,
              distance: '1.2 miles',
              address: '123 Main St',
              city: 'Austin',
              state: 'TX',
              postalCode: '78759',
              phone: '(512) 555-1234',
              latitude: 30.4015,
              longitude: -97.7527,
              open24H: false
            },
            {
              name: 'CVS Pharmacy',
              price: 14.50,
              distance: '1.5 miles',
              address: '456 Oak St',
              city: 'Austin',
              state: 'TX',
              postalCode: '78759',
              phone: '(512) 555-5678',
              latitude: 30.4025,
              longitude: -97.7537,
              open24H: true
            },
            {
              name: 'Walmart Pharmacy',
              price: 9.99,
              distance: '2.3 miles',
              address: '789 Pine St',
              city: 'Austin',
              state: 'TX',
              postalCode: '78759',
              phone: '(512) 555-9012',
              latitude: 30.4035,
              longitude: -97.7547,
              open24H: false
            }
          ];
          
          setPharmacyPrices(mockPharmacies);
        }
        
        // If we don't have brand variations by now, add mock data
        if (brandVariations.length === 0) {
          console.log('No brand variations after timeout, adding mock data');
          
          const drugName = params.name;
          
          // Add mock brand variations
          const mockVariations = [
            {
              name: `${drugName} (brand)`,
              type: 'brand',
              gsn: 1790
            },
            {
              name: `${drugName} (generic)`,
              type: 'generic',
              gsn: 1791
            }
          ];
          
          setBrandVariations(mockVariations);
          
          // Set the first one as selected if no brand is selected
          if (!selectedBrand) {
            setSelectedBrand(mockVariations[0]);
          }
        }
      }
    }, 5000); // 5 seconds timeout
    
    // Try to get user's location
    getUserLocation();
    
    // Fetch drug info
    fetchDrugInfo();
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Function to fetch pharmacy prices
  const fetchPharmacyPrices = async (latitude: number, longitude: number, radius: number) => {
    try {
      setIsLoadingPharmacies(true)
      setError(null)
      
      if (!drugInfo && !params.name) {
        console.error('Cannot fetch pharmacy prices: No drug info or name available')
        setError('Drug information not available. Please try searching again.')
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
        customizedQuantity: false,
        maximumPharmacies: 50 // Request more pharmacies for better results
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
      
      // Check if we're using mock data
      if ((response as any).usingMockData) {
        console.warn('Using mock pharmacy data - real API data not available')
      }
      
      // Store brand variations if available
      if (response.brandVariations && Array.isArray(response.brandVariations)) {
        console.log('Setting brand variations:', response.brandVariations)
        setBrandVariations(response.brandVariations)
        
        // If we have brand variations but no selected brand, set the first one as selected
        if (response.brandVariations.length > 0 && !selectedBrand) {
          console.log('Setting initial selected brand:', response.brandVariations[0])
          setSelectedBrand(response.brandVariations[0])
        }
      } else {
        console.warn('No brand variations found in API response')
        // Create default brand variations if none are provided
        const defaultVariations = [
          {
            name: `${drugName} (brand)`,
            type: 'brand',
            gsn: gsnToUse || 1790
          },
          {
            name: `${drugName} (generic)`,
            type: 'generic',
            gsn: gsnToUse ? gsnToUse + 1 : 1791
          }
        ]
        console.log('Setting default brand variations:', defaultVariations)
        setBrandVariations(defaultVariations)
        
        // Set the first one as selected if no brand is selected
        if (!selectedBrand) {
          setSelectedBrand(defaultVariations[0])
        }
      }
      
      // Check if we have pharmacy data from the API response
      if ((response as any).pharmacyPrices && Array.isArray((response as any).pharmacyPrices)) {
        // API returned data in the new format with detailed pharmacy information
        console.log('Using detailed pharmacy data from API')
        
        // Map the API response to our PharmacyPrice format
        const mappedPharmacies = ((response as any).pharmacyPrices).map((item: any) => {
          const pharmacy = item.pharmacy || {};
          const price = item.price || {};
          
          return {
            name: pharmacy.name || 'Unknown Pharmacy',
            price: parseFloat(price.price) || 0,
            distance: `${pharmacy.distance?.toFixed(1) || '0.0'} miles`,
            address: pharmacy.streetAddress || '',
            city: pharmacy.city || '',
            state: pharmacy.state || '',
            postalCode: pharmacy.zipCode || '',
            phone: pharmacy.phone || '',
            latitude: pharmacy.latitude,
            longitude: pharmacy.longitude,
            open24H: pharmacy.open24H || false
          };
        });
        
        // Sort pharmacies based on selected sort option
        if (selectedSort === 'PRICE') {
          mappedPharmacies.sort((a: PharmacyPrice, b: PharmacyPrice) => a.price - b.price)
        } else if (selectedSort === 'DISTANCE') {
          mappedPharmacies.sort((a: PharmacyPrice, b: PharmacyPrice) => {
            const distanceA = parseFloat(a.distance.replace(' miles', ''))
            const distanceB = parseFloat(b.distance.replace(' miles', ''))
            return distanceA - distanceB
          })
        }
        
        setPharmacyPrices(mappedPharmacies)
        console.log(`Found ${mappedPharmacies.length} pharmacies with prices from API`)
      }
      else if (response.pharmacies && response.pharmacies.length > 0) {
        // Legacy format or mock data
        console.log('Using legacy pharmacy data format')
        
        // Sort pharmacies based on selected sort option
        let sortedPharmacies = [...response.pharmacies]
        
        if (selectedSort === 'PRICE') {
          sortedPharmacies.sort((a, b) => a.price - b.price)
        } else if (selectedSort === 'DISTANCE') {
          sortedPharmacies.sort((a, b) => {
            const distanceA = parseFloat(a.distance.replace(' miles', '').replace(' mi', ''))
            const distanceB = parseFloat(b.distance.replace(' miles', '').replace(' mi', ''))
            return distanceA - distanceB
          })
        }
        
        setPharmacyPrices(sortedPharmacies)
        console.log(`Found ${sortedPharmacies.length} pharmacies with prices from legacy format`)
      } else {
        console.warn('No pharmacy prices found in the response')
        setError('No pharmacy prices found for this medication in your area.')
        setPharmacyPrices([])
      }
      
      // Always set loading to false after processing the response
      setIsLoading(false)
      setIsLoadingPharmacies(false)
    } catch (error) {
      console.error('Error fetching pharmacy prices:', error)
      setError(`Error loading pharmacy prices: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsLoading(false)
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
    } catch (error) {
      console.error('Error fetching drug info:', error)
      setError(`Error loading drug information: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setDrugInfo(null)
    } finally {
      // Always set loading to false
      setIsLoading(false)
    }
  }

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
      
      if (!newLocation || !newLocation.latitude || !newLocation.longitude) {
        throw new Error(`Could not geocode ZIP code: ${newZipCode}`);
      }
      
      console.log(`Geocoded ${newZipCode} to coordinates:`, newLocation);
      
      // Update user location with the complete object
      console.log("Setting new user location from ZIP code:", newLocation);
      setUserLocation({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        zipCode: newLocation.zipCode
      });
      
      // Fetch prices with new location
      console.log(`Fetching pharmacy prices with new location: ${newLocation.latitude}, ${newLocation.longitude}, ${searchRadius}`);
      await fetchPharmacyPrices(newLocation.latitude, newLocation.longitude, searchRadius);
      
      // Show success message or visual feedback
      toast.success(`Updated location to ${newZipCode}`);
    } catch (error) {
      console.error("Error updating location:", error);
      setError("Failed to update location. Please try a valid US ZIP code.");
      toast.error("Failed to update location. Please try a valid US ZIP code.");
    } finally {
      // Always reset loading state
      setIsLoadingPharmacies(false);
      
      // Set a timeout to ensure the loading state is reset in the map component
      setTimeout(() => {
        console.log("Ensuring map loading state is reset");
        // This will trigger a re-render of the map component
        setUserLocation(prevLocation => ({
          ...prevLocation
        }));
      }, 1000);
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

          {/* Brand Variations Section */}
          {brandVariations && brandVariations.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="mb-8"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Brand/Generic Variations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {brandVariations.map((variation, index) => (
                  <div 
                    key={`variation-${index}`}
                    className={`border rounded-md p-3 cursor-pointer transition-all ${
                      variation.type === 'brand' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                    }`}
                    onClick={() => {
                      if (variation.gsn) {
                        window.location.href = `/drug/${encodeURIComponent(variation.name.split(' ')[0])}?gsn=${variation.gsn}`;
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{variation.name}</p>
                        <p className="text-sm text-gray-600 capitalize">{variation.type}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        variation.type === 'brand' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {variation.type === 'brand' ? 'Brand' : 'Generic'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Main Content - Prices and Map */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-full"
          >
            {showPrices && (
              <>
                <div className="lg:col-span-6 order-2 lg:order-1">
                  <div className="bg-white rounded-xl shadow-lg p-5 mb-4 border border-gray-100 h-full">
                    <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Pharmacy Prices</h3>
                        <p className="text-sm text-gray-500 mt-1">Compare prices at nearby pharmacies</p>
                      </div>
                      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                        <select 
                          className="text-sm border border-gray-200 rounded-md p-2 bg-white hover:border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
                          value={selectedSort}
                          onChange={handleSortChange}
                          disabled={isLoadingPharmacies}
                        >
                          <option value="PRICE">Sort by Price</option>
                          <option value="DISTANCE">Sort by Distance</option>
                        </select>
                        <select 
                          className="text-sm border border-gray-200 rounded-md p-2 bg-white hover:border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
                          value={pharmaciesPerPage}
                          onChange={handlePharmaciesPerPageChange}
                          disabled={isLoadingPharmacies}
                        >
                          <option value="5">Show 5</option>
                          <option value="10">Show 10</option>
                          <option value="20">Show 20</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Pharmacy list */}
                    <div ref={pharmacyListRef} className="space-y-4">
                      {isLoadingPharmacies ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                          <p className="text-gray-600">Loading pharmacy prices...</p>
                        </div>
                      ) : error ? (
                        <div className="text-center py-8">
                          <p className="text-red-500">{error}</p>
                        </div>
                      ) : pharmacyPrices.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No pharmacy prices found for this medication in your area.</p>
                          <p className="text-gray-500 mt-2">Try increasing your search radius or changing your location.</p>
                        </div>
                      ) : (
                        // Get current pharmacies for pagination
                        pharmacyPrices
                          .slice((currentPage - 1) * pharmaciesPerPage, currentPage * pharmaciesPerPage)
                          .map((pharmacy, index) => {
                            // Calculate the actual index in the full array for badges and numbering
                            const actualIndex = (currentPage - 1) * pharmaciesPerPage + index;
                            // Determine if this is the best price
                            const isBestPrice = actualIndex === 0 && selectedSort === 'PRICE';
                            // Determine if this is the closest pharmacy
                            const isClosest = actualIndex === 0 && selectedSort === 'DISTANCE';
                          
                          return (
                            <div 
                              key={`${pharmacy.name}-${actualIndex}`}
                              data-pharmacy-id={actualIndex}
                              className={`relative border rounded-lg p-4 ${
                                isBestPrice ? 'pt-8 mt-4' : 'pt-5'
                              } cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${
                                selectedPharmacy === pharmacy 
                                  ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' 
                                  : isBestPrice
                                    ? 'border-emerald-600 border-2 hover:border-emerald-700'
                                    : 'hover:border-emerald-300'
                              }`}
                              onClick={() => setSelectedPharmacy(pharmacy)}
                            >
                              {isBestPrice && (
                                <div className="absolute -top-3 left-3 px-2 py-1 bg-emerald-600 text-white text-xs font-medium rounded-md shadow-sm">
                                  Best Price
                                </div>
                              )}
                              {isClosest && (
                                <div className="absolute -top-3 left-3 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-md shadow-sm">
                                  Closest
                                </div>
                              )}
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center">
                                    <span className={`flex items-center justify-center w-6 h-6 ${
                                      isBestPrice 
                                        ? 'bg-emerald-600 text-white' 
                                        : 'bg-emerald-100 text-emerald-800'
                                      } rounded-full text-sm font-medium mr-2`}>
                                      {actualIndex + 1}
                                    </span>
                                    <h4 className="font-semibold text-gray-800">{pharmacy.name}</h4>
                                  </div>
                                  <div className="flex items-center mt-1 text-sm text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1 1 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>{pharmacy.distance}</span>
                                  </div>
                                  {pharmacy.address && (
                                    <p className="text-xs text-gray-500 mt-1 ml-5">{pharmacy.address}</p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button 
                                    className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGetCoupon(pharmacy);
                                    }}
                                  >
                                    Get Coupon
                                  </button>
                                  <div className={`${isBestPrice ? 'bg-emerald-100' : 'bg-emerald-50'} px-3 py-1 rounded-lg`}>
                                    <p className={`text-xl font-bold ${isBestPrice ? 'text-emerald-700' : 'text-emerald-600'}`}>${pharmacy.price.toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    {/* Pagination Controls */}
                    {!isLoadingPharmacies && !error && pharmacyPrices.length > 0 && (
                      <div className="flex justify-center items-center mt-6 space-x-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-3 py-1 rounded-md ${
                            currentPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        <div className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages}
                        </div>
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1 rounded-md ${
                            currentPage === totalPages
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="lg:col-span-6 order-1 lg:order-2">
                  <div className="bg-white rounded-xl shadow-lg p-5 h-full border border-gray-100">
                    <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Pharmacy Map</h3>
                        <p className="text-sm text-gray-500 mt-1">Showing pharmacies from page {currentPage}</p>
                      </div>
                      <div className="flex items-center">
                        {isLoadingPharmacies && (
                          <div className="flex items-center text-emerald-600">
                            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent mr-2"></div>
                            <span className="text-sm">Loading...</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="h-[600px]">
                      <PharmacyMap 
                        pharmacies={pharmacyPrices
                          .slice((currentPage - 1) * pharmaciesPerPage, currentPage * pharmaciesPerPage)
                          .map((pharmacy, index) => {
                            // Calculate the actual index in the full array for proper identification
                            const actualIndex = (currentPage - 1) * pharmaciesPerPage + index;
                            return {
                              pharmacyId: actualIndex,
                              name: pharmacy.name,
                              address: pharmacy.address || '',
                              city: pharmacy.city || '',
                              state: pharmacy.state || '',
                              postalCode: pharmacy.zipCode || '',
                              phone: pharmacy.phone || '',
                              distance: typeof pharmacy.distance === 'string' 
                                ? parseFloat(pharmacy.distance.replace(' miles', '').replace(' mi', '')) 
                                : pharmacy.distance,
                              latitude: pharmacy.latitude,
                              longitude: pharmacy.longitude,
                              price: pharmacy.price
                            };
                          })
                        }
                        zipCode={userLocation.zipCode}
                        centerLat={userLocation.latitude}
                        centerLng={userLocation.longitude}
                        onMarkerClick={(pharmacy) => {
                          const matchingPharmacy = pharmacyPrices.find((p, idx) => idx === pharmacy.pharmacyId);
                          if (matchingPharmacy) {
                            setSelectedPharmacy(matchingPharmacy);
                            // Scroll to the pharmacy in the list
                            const pharmacyIndex = pharmacyPrices.indexOf(matchingPharmacy);
                            const page = Math.floor(pharmacyIndex / pharmaciesPerPage) + 1;
                            if (page !== currentPage) {
                              setCurrentPage(page);
                            }
                            // Wait for the DOM to update with the new page
                            setTimeout(() => {
                              const pharmacyElements = document.querySelectorAll('[data-pharmacy-id]');
                              const targetElement = Array.from(pharmacyElements).find(
                                (el) => el.getAttribute('data-pharmacy-id') === String(pharmacy.pharmacyId)
                              );
                              if (targetElement && pharmacyListRef.current) {
                                targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                              }
                            }, 100);
                          }
                        }}
                        onZipCodeChange={handleZipCodeChange}
                        searchRadius={Number(searchRadius)}
                        onRadiusChange={(radius) => {
                          // Convert the radius to a string and update the state
                          const newRadius = radius.toString();
                          handleSearchRadiusChange({ target: { value: newRadius } } as React.ChangeEvent<HTMLSelectElement>);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
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