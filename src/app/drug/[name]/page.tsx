'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { getDrugInfo, getDrugPrices, getDetailedDrugInfo, searchMedications, getGsnForDrugName } from '@/services/medicationApi'
import LoadingState from '@/components/search/LoadingState'
import { DrugInfo as DrugInfoType, DrugDetails, PharmacyPrice, APIError, DrugSearchResponse, DrugPriceResponse, DrugForm, DrugStrength, DrugQuantity } from '@/types/api'
import PharmacyMap from '@/components/maps/PharmacyMap'
import Link from 'next/link'
import Image from 'next/image'
import CouponModal from '@/components/CouponModal'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface Props {
  params: {
    name: string
  }
}

export default function DrugPage({ params }: Props) {
  console.log('DrugPage component rendering with params:', params);
  
  const searchParams = useSearchParams()
  const gsn = searchParams.get('gsn')
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drugInfo, setDrugInfo] = useState<DrugInfoType | null>(null)
  const [drugDetails, setDrugDetails] = useState<DrugDetails | null>(null)
  const [detailedInfo, setDetailedInfo] = useState<any | null>(null)
  const [pharmacyPrices, setPharmacyPrices] = useState<PharmacyPrice[]>([])
  const [brandVariations, setBrandVariations] = useState<any[]>([])
  
  // Filter state
  const [selectedBrandType, setSelectedBrandType] = useState<string>('generic')
  const [selectedBrandName, setSelectedBrandName] = useState<string>(decodeURIComponent(params.name))
  const [availableForms, setAvailableForms] = useState<DrugForm[]>([])
  const [selectedForm, setSelectedForm] = useState<string>('CAPSULE')
  const [availableStrengths, setAvailableStrengths] = useState<DrugStrength[]>([])
  const [selectedStrength, setSelectedStrength] = useState<string>('500 mg')
  const [availableQuantities, setAvailableQuantities] = useState<DrugQuantity[]>([])
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
          
          setPharmacyPrices(prevPrices => {
            // Only set mock data if we still don't have real data
            if (prevPrices.length === 0) {
              console.log('Setting mock pharmacy prices');
              return mockPharmacies;
            }
            console.log('Real pharmacy prices already set, not using mock data');
            return prevPrices;
          });
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
          
          setBrandVariations(prevVariations => {
            // Only set mock data if we still don't have real data
            if (prevVariations.length === 0) {
              console.log('Setting mock brand variations');
              return mockVariations;
            }
            console.log('Real brand variations already set, not using mock data');
            return prevVariations;
          });
          
          // Set the first one as selected if no brand is selected
          if (!selectedBrandName) {
            setSelectedBrandName(mockVariations[0].name);
          }
        }
      }
    }, 5000); // 5 seconds timeout
    
    // Define an async function to load all data in the correct order
    const loadData = async () => {
      try {
        // First, try to get user's location
        await getUserLocation();
        
        // Skip drug info fetch since it's not defined
        // await fetchDrugInfo();
        
        // Fetch pharmacy prices which will also update brand variations
        if (userLocation.latitude && userLocation.longitude) {
          await fetchPharmacyPrices(userLocation.latitude, userLocation.longitude, searchRadius);
          
          // If we have a GSN from the URL, get detailed drug info to ensure we have the most accurate data
          if (gsn) {
            const gsnNumber = parseInt(gsn, 10);
            console.log(`Getting additional detailed drug info for GSN: ${gsnNumber}`);
            
            try {
              const detailedInfo = await getDetailedDrugInfo(gsnNumber);
              console.log('Additional detailed drug info:', detailedInfo);
              
              // Update the detailed info in state
              setDetailedInfo(detailedInfo);
              
              // Extract available forms, strengths, and quantities from the detailed info
              if (detailedInfo.forms && Array.isArray(detailedInfo.forms)) {
                console.log('Updating available forms with more accurate data:', detailedInfo.forms);
                setAvailableForms(detailedInfo.forms);
                
                // Set default selected form
                const defaultForm = detailedInfo.forms.find((form: DrugForm) => form.selected) || detailedInfo.forms[0];
                if (defaultForm) {
                  console.log('Updating default form with more accurate data:', defaultForm.form);
                  setSelectedForm(defaultForm.form);
                }
              }
              
              if (detailedInfo.strengths && Array.isArray(detailedInfo.strengths)) {
                console.log('Updating available strengths with more accurate data:', detailedInfo.strengths);
                setAvailableStrengths(detailedInfo.strengths);
                
                // Set default selected strength
                const defaultStrength = detailedInfo.strengths.find((strength: DrugStrength) => strength.selected) || detailedInfo.strengths[0];
                if (defaultStrength) {
                  console.log('Updating default strength with more accurate data:', defaultStrength.strength);
                  setSelectedStrength(defaultStrength.strength);
                }
              }
              
              if (detailedInfo.quantities && Array.isArray(detailedInfo.quantities)) {
                console.log('Updating available quantities with more accurate data:', detailedInfo.quantities);
                setAvailableQuantities(detailedInfo.quantities);
                
                // Set default selected quantity
                const defaultQuantity = detailedInfo.quantities.find((qty: DrugQuantity) => qty.selected) || detailedInfo.quantities[0];
                if (defaultQuantity) {
                  console.log('Updating default quantity with more accurate data:', `${defaultQuantity.quantity} ${defaultQuantity.uom}`);
                  setSelectedQuantity(`${defaultQuantity.quantity} ${defaultQuantity.uom}`);
                }
              }
            } catch (error) {
              console.error('Error getting additional detailed drug info:', error);
              // Continue even if there was an error
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
        setError('Error loading drug information. Please try again later.');
      }
    };
    
    // Start loading data
    loadData();
    
    // Clean up the timeout
    return () => clearTimeout(timeoutId);
  }, []);

  // Function to fetch pharmacy prices
  const fetchPharmacyPrices = async (latitude: number, longitude: number, radius: number) => {
    setIsLoadingPharmacies(true);
    setError(null);
    
    try {
      console.log(`Fetching pharmacy prices for ${params.name} at location (${latitude}, ${longitude}) with radius ${radius} miles`);
      
      // Decode the drug name from the URL
      const drugName = decodeURIComponent(params.name);
      
      // Always use the drug name for price lookups as it's more reliable
      console.log(`Using drug name "${drugName}" for price lookup (more reliable than GSN)`);
      
      // Prepare the request - explicitly omit GSN to force using the byName endpoint
      const request = {
        drugName: drugName,
        // Omitting GSN to ensure we use the byName endpoint
        latitude,
        longitude,
        radius,
        quantity: parseInt(selectedQuantity.split(' ')[0], 10) || 30,
        customizedQuantity: true
      };
      
      console.log('Drug price request:', request);
      
      // Get drug prices using the drug name
      const priceData = await getDrugPrices(request);
      console.log('Drug price response:', priceData);
      
      // Use type assertion to handle the extended API response format
      const apiResponse = priceData as any;
      
      // Flag to track if we've successfully processed any data
      let dataProcessed = false;
      
      if (apiResponse) {
        // Process pharmacy prices if available
        if (apiResponse.pharmacies && Array.isArray(apiResponse.pharmacies) && apiResponse.pharmacies.length > 0) {
          console.log(`Found ${apiResponse.pharmacies.length} pharmacies with prices`);
          
          // Sort pharmacies by price (lowest first)
          const sortedPharmacies = [...apiResponse.pharmacies].sort((a, b) => {
            const priceA = typeof a.price === 'string' ? parseFloat(a.price) : a.price;
            const priceB = typeof b.price === 'string' ? parseFloat(b.price) : b.price;
            return priceA - priceB;
          });
          
          setPharmacyPrices(sortedPharmacies);
          setCurrentPage(1); // Reset to first page when new results come in
          dataProcessed = true;
        } else if (apiResponse.pharmacyPrices && Array.isArray(apiResponse.pharmacyPrices) && apiResponse.pharmacyPrices.length > 0) {
          // Alternative format - some responses use pharmacyPrices instead of pharmacies
          console.log(`Found ${apiResponse.pharmacyPrices.length} pharmacies with prices (pharmacyPrices format)`);
          
          // Map to the expected format
          const mappedPharmacies = apiResponse.pharmacyPrices.map((item: any) => {
            return {
              name: item.pharmacy?.name || 'Unknown Pharmacy',
              price: parseFloat(item.price?.price) || 0,
              distance: `${item.pharmacy?.distance?.toFixed(1) || '0.0'} miles`,
              address: item.pharmacy?.streetAddress || '',
              city: item.pharmacy?.city || '',
              state: item.pharmacy?.state || '',
              zipCode: item.pharmacy?.zipCode || '',
              phone: item.pharmacy?.phone || '',
              latitude: item.pharmacy?.latitude,
              longitude: item.pharmacy?.longitude,
              open24H: item.pharmacy?.open24H || false
            };
          });
          
          // Sort pharmacies by price (lowest first)
          const sortedPharmacies = mappedPharmacies.sort((a: any, b: any) => a.price - b.price);
          
          setPharmacyPrices(sortedPharmacies);
          setCurrentPage(1);
          dataProcessed = true;
      } else {
          console.log('No pharmacies found with prices');
          setPharmacyPrices([]);
          // Only set error if we don't process any other data
          // We'll set this at the end if needed
        }
        
        // Process drug info if available
        if (apiResponse.drug && apiResponse.drug.gsn) {
          console.log(`Found GSN ${apiResponse.drug.gsn} for drug "${drugName}" in the API response`);
          
          // Update drug info with data from the API
          setDrugInfo(prevInfo => {
            if (!prevInfo) {
              return {
                brandName: apiResponse.drug.medName || drugName,
                genericName: apiResponse.drug.medName || drugName,
                gsn: apiResponse.drug.gsn,
                ndcCode: apiResponse.drug.ndcCode || '',
                description: '',
                sideEffects: '',
                dosage: '',
                storage: '',
                contraindications: ''
              };
            }
            return {
              ...prevInfo,
              gsn: apiResponse.drug.gsn,
              ndcCode: apiResponse.drug.ndcCode || prevInfo.ndcCode || '',
              brandName: apiResponse.drug.medName || prevInfo.brandName,
              genericName: apiResponse.drug.medName || prevInfo.genericName
            };
          });
          
          // Store the detailed info for reference
          setDetailedInfo(apiResponse);
          
          // If we don't already have a GSN in the URL, get detailed drug info using the GSN from the API response
          if (!gsn && apiResponse.drug.gsn) {
            try {
              console.log(`Getting detailed drug info using GSN ${apiResponse.drug.gsn} from API response`);
              const detailedDrugInfo = await getDetailedDrugInfo(apiResponse.drug.gsn);
              console.log('Detailed drug info from API response GSN:', detailedDrugInfo);
              
              // Update the detailed info in state
              setDetailedInfo({
                ...apiResponse,
                ...detailedDrugInfo
              });
              
              // Extract additional forms, strengths, and quantities if available
              if (detailedDrugInfo.forms && Array.isArray(detailedDrugInfo.forms) && detailedDrugInfo.forms.length > 0) {
                console.log('Updating forms with data from detailed drug info:', detailedDrugInfo.forms);
                setAvailableForms(detailedDrugInfo.forms);
                
                // Set default selected form
                const defaultForm = detailedDrugInfo.forms.find((form: DrugForm) => form.selected) || detailedDrugInfo.forms[0];
                if (defaultForm) {
                  console.log('Setting default form from detailed drug info:', defaultForm.form);
                  setSelectedForm(defaultForm.form);
                }
              }
              
              if (detailedDrugInfo.strengths && Array.isArray(detailedDrugInfo.strengths) && detailedDrugInfo.strengths.length > 0) {
                console.log('Updating strengths with data from detailed drug info:', detailedDrugInfo.strengths);
                setAvailableStrengths(detailedDrugInfo.strengths);
                
                // Set default selected strength
                const defaultStrength = detailedDrugInfo.strengths.find((strength: DrugStrength) => strength.selected) || detailedDrugInfo.strengths[0];
                if (defaultStrength) {
                  console.log('Setting default strength from detailed drug info:', defaultStrength.strength);
                  setSelectedStrength(defaultStrength.strength);
                }
              }
              
              if (detailedDrugInfo.quantities && Array.isArray(detailedDrugInfo.quantities) && detailedDrugInfo.quantities.length > 0) {
                console.log('Updating quantities with data from detailed drug info:', detailedDrugInfo.quantities);
                setAvailableQuantities(detailedDrugInfo.quantities);
                
                // Set default selected quantity
                const defaultQuantity = detailedDrugInfo.quantities.find((qty: DrugQuantity) => qty.selected) || detailedDrugInfo.quantities[0];
                if (defaultQuantity) {
                  console.log('Setting default quantity from detailed drug info:', `${defaultQuantity.quantity} ${defaultQuantity.uom}`);
                  setSelectedQuantity(`${defaultQuantity.quantity} ${defaultQuantity.uom}`);
                }
              }
            } catch (error) {
              console.error('Error getting detailed drug info from API response GSN:', error);
              // Continue even if there was an error
            }
          }
          
          dataProcessed = true;
        }
        
        // Always navigate to the new drug page to ensure we get fresh data
        console.log(`Navigating to new drug page for: ${drugName}`);
        
        // Encode the drug name for the URL
        const encodedDrugName = encodeURIComponent(drugName);
        
        // Create the new URL with GSN if available
        let newUrl = `/drug/${encodedDrugName}`;
        if (gsn) {
          newUrl += `?gsn=${gsn}`;
        }
        
        // Navigate to the new URL
        window.location.href = newUrl;
        return; // Stop execution since we're navigating away
      }
    } catch (error) {
      console.error('Error fetching pharmacy prices:', error);
      setError('Error fetching pharmacy prices. Please try again later.');
    }
    
    // If we don't have brand variations or couldn't find a match,
    // just refetch pharmacy prices with the current location and search radius
    try {
      await fetchPharmacyPrices(userLocation.latitude, userLocation.longitude, searchRadius);
    } catch (error) {
      console.error('Error fetching pharmacy prices:', error);
      setError('Error fetching pharmacy prices. Please try again later.');
    }
  };

  // Handle ZIP code submission
  const handleZipCodeSubmit = async () => {
    if (!userLocation.zipCode || userLocation.zipCode.length < 5) {
      setError('Please enter a valid ZIP code');
      return;
    }

    setIsLoadingPharmacies(true);
    
    try {
      // Use Google Maps Geocoding API to get coordinates from ZIP code
      const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${userLocation.zipCode}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(geocodingUrl);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        
        // Update user location with coordinates from ZIP code
        setUserLocation({
          ...userLocation,
          latitude: location.lat,
          longitude: location.lng
        });
        
        // Fetch pharmacy prices with the new location
        await fetchPharmacyPrices(location.lat, location.lng, searchRadius);
      } else {
        setError('Could not find location for the provided ZIP code');
        setIsLoadingPharmacies(false);
      }
    } catch (error) {
      console.error('Error getting coordinates from ZIP code:', error);
      setError('Error getting coordinates from ZIP code');
      setIsLoadingPharmacies(false);
    }
  };

  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {isLoading ? (
        <LoadingState />
      ) : !drugInfo ? (
        // Only show the full error page if we have no drug info at all
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Drug Information</h2>
          <p className="text-red-600">{error || 'Could not load drug information. Please try again later.'}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-4 text-red-700 hover:text-red-800 font-medium"
          >
            ← Back to Search
          </button>
        </div>
      ) : (
        <>
          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {drugInfo?.brandName || params.name}
            </h1>
            <p className="text-gray-600">
              Pricing is displayed for {drugInfo?.genericName || params.name}
            </p>
          </motion.div>

          {/* Show error message as a banner if we have drug info but encountered an error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Medication Form Selectors */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Brand</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedBrandName}
                  onChange={handleBrandChange}
                  disabled={isLoading || brandVariations.length === 0}
                >
                  {brandVariations.map((variation, index) => (
                    <option key={`brand-${index}`} value={variation.name}>
                      {variation.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Form</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedForm}
                  onChange={handleFormChange}
                  disabled={isLoading || availableForms.length === 0}
                >
                  {availableForms.map((form, index) => (
                      <option key={`form-${index}`} value={form.form}>
                        {form.form}
                      </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Dosage</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedStrength}
                  onChange={handleStrengthChange}
                  disabled={isLoading || availableStrengths.length === 0}
                >
                  {availableStrengths.map((strength, index) => (
                      <option key={`strength-${index}`} value={strength.strength}>
                        {strength.strength}
                      </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedQuantity}
                  onChange={handleQuantityChange}
                  disabled={isLoading || availableQuantities.length === 0}
                >
                  {availableQuantities.map((qty, index) => (
                      <option key={`qty-${index}`} value={`${qty.quantity} ${qty.uom}`}>
                        {qty.quantity} {qty.uom}
                      </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Main Content - Prices and Map */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pharmacy Prices */}
            <div className="h-full">
              <div className="bg-white rounded-lg shadow p-4 mb-4 h-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Pharmacy Prices</h3>
                  <div className="flex space-x-2">
                    <select 
                      className="text-sm border border-gray-300 rounded p-1"
                      value={selectedSort}
                      onChange={handleSortChange}
                    >
                      <option value="PRICE">Sort by Price</option>
                      <option value="DISTANCE">Sort by Distance</option>
                    </select>
                    <select 
                      className="text-sm border border-gray-300 rounded p-1"
                      value={pharmaciesPerPage}
                      onChange={handlePharmaciesPerPageChange}
                    >
                      <option value="5">Show 5</option>
                      <option value="10">Show 10</option>
                      <option value="20">Show 20</option>
                    </select>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Compare prices at nearby pharmacies</p>
                
                {/* Pharmacy list without fixed height */}
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
                          className={`relative border rounded-lg p-4 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${
                            selectedPharmacy === pharmacy 
                              ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' 
                              : 'hover:border-emerald-300'
                          }`}
                          onClick={() => setSelectedPharmacy(pharmacy)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <span className="flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mr-2">
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
                              <div className="bg-emerald-50 px-3 py-1 rounded-lg">
                                <p className="text-xl font-bold text-emerald-600">${pharmacy.price.toFixed(2)}</p>
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
            
            {/* Pharmacy Map */}
            <div className="h-full flex flex-col">
              <div className="bg-white rounded-lg shadow p-4 mb-4 h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-2">Pharmacy Map</h3>
                <p className="text-sm text-gray-600 mb-4">Showing pharmacies from page {currentPage}</p>
                
                <div className="flex-grow relative" style={{ minHeight: '500px' }}>
                  <PharmacyMap 
                    pharmacies={pharmacyPrices
                      .slice((currentPage - 1) * pharmaciesPerPage, currentPage * pharmaciesPerPage)
                      .map((pharmacy, index) => {
                        // Calculate the actual index in the full array for proper identification
                        const actualIndex = (currentPage - 1) * pharmaciesPerPage + index;
                        
                        // Convert to the format expected by PharmacyMap
                        return {
                          pharmacyId: actualIndex,
                          name: pharmacy.name || '',
                          address: pharmacy.address || '',
                          city: pharmacy.city || '',
                          state: pharmacy.state || '',
                          postalCode: pharmacy.zipCode || '', // Map zipCode to postalCode
                          phone: pharmacy.phone || '',
                          distance: typeof pharmacy.distance === 'string' 
                            ? parseFloat(pharmacy.distance.replace(' miles', '').replace(' mi', '')) 
                            : 0,
                          latitude: pharmacy.latitude,
                          longitude: pharmacy.longitude,
                          price: pharmacy.price,
                          open24H: pharmacy.open24H
                        };
                      })}
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
                  />
                </div>
              </div>
            </div>
          </div>

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

          {/* Fallback UI if pharmacyPrices is empty */}
          {pharmacyPrices.length === 0 && !isLoadingPharmacies && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-yellow-700 mb-2">No Pharmacy Prices Found</h2>
              <p className="text-yellow-600">We couldn't find pharmacy prices for this medication in your area. Please try again later or search for a different medication.</p>
              <button 
                onClick={() => getUserLocation()}
                className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Drug Information Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-12"
          >
            <button 
              className="flex items-center justify-between w-full p-4 bg-[#006142] text-white rounded-t-lg shadow-md"
              onClick={() => setIsInfoExpanded(!isInfoExpanded)}
            >
              <span className="font-medium">{drugInfo?.genericName?.toUpperCase()} DRUG INFORMATION</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 transition-transform duration-300 ${isInfoExpanded ? 'transform rotate-180' : ''}`}
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {isInfoExpanded && (
              <div className="border border-gray-200 rounded-b-lg shadow-md bg-white overflow-hidden">
                {/* Drug Name Section */}
                <div className="bg-gray-50 p-5 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-[#006142] flex items-center justify-center mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Brand Name</h3>
                          <p className="text-lg font-semibold text-gray-900">{detailedInfo?.brandName || drugInfo?.brandName || 'No brand name available.'}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-[#006142] flex items-center justify-center mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Generic Name</h3>
                          <p className="text-lg font-semibold text-gray-900">{detailedInfo?.genericName || drugInfo?.genericName || 'No generic name available.'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Main Drug Information */}
                <div className="p-5">
                  <div className="grid grid-cols-1 gap-6">
                    {/* Description */}
                    <div className="bg-white rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-md font-semibold text-gray-900">Description</h3>
                          <p className="mt-1 text-gray-700">{detailedInfo?.description || drugInfo?.description || 'No description available.'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Safety Information */}
                    <div className="bg-white rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-md font-semibold text-gray-900">Important Safety Information</h3>
                          <p className="mt-1 text-gray-700">{detailedInfo?.monitor || 'No safety information available.'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Directions for Use */}
                    <div className="bg-white rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-md font-semibold text-gray-900">Directions for Use</h3>
                          <p className="mt-1 text-gray-700">{detailedInfo?.admin || 'No directions for use available.'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contraindications */}
                    <div className="bg-white rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-md font-semibold text-gray-900">Contraindications & Precautions</h3>
                          <p className="mt-1 text-gray-700">{detailedInfo?.contra || drugInfo?.contraindications || 'No contraindication information available.'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Side Effects */}
                    <div className="bg-white rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-md font-semibold text-gray-900">Side Effects</h3>
                          <p className="mt-1 text-gray-700">{detailedInfo?.side || drugInfo?.sideEffects || 'No side effects information available.'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Drug Interactions */}
                    <div className="bg-white rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-md font-semibold text-gray-900">Drug Interactions</h3>
                          <p className="mt-1 text-gray-700">{detailedInfo?.interaction || 'No drug interaction information available.'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Missed Dose */}
                    <div className="bg-white rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-md font-semibold text-gray-900">Missed Dose</h3>
                          <p className="mt-1 text-gray-700">{detailedInfo?.missed || 'No missed dose information available.'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Storage Instructions */}
                    <div className="bg-white rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-md font-semibold text-gray-900">Storage Instructions</h3>
                          <p className="mt-1 text-gray-700">{detailedInfo?.store || drugInfo?.storage || 'No storage information available.'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Disclaimer */}
                <div className="bg-gray-50 p-4 border-t border-gray-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="ml-3 text-sm text-gray-600">
                      <span className="font-medium text-gray-700">General Disclaimer:</span> {detailedInfo?.disclaimer || 'This information is for educational purposes only. Always consult your healthcare provider for medical advice.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
} 