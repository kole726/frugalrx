'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { getDrugInfo, getDrugPrices, getDetailedDrugInfo, searchMedications } from '@/services/medicationApi'
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
  const [pharmacyPrices, setPharmacyPrices] = useState<PharmacyPrice[]>([])
  const [brandVariations, setBrandVariations] = useState<any[]>([])
  
  // Filter state
  const [selectedBrand, setSelectedBrand] = useState<string>('generic')
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
          if (!selectedBrand) {
            setSelectedBrand(mockVariations[0].type);
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
      console.log(`Form: ${selectedForm}, Strength: ${selectedStrength}, Quantity: ${selectedQuantity}`)
      
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
      
      // Add form if selected
      if (selectedForm) {
        Object.assign(request, { form: selectedForm })
      }
      
      // Add strength if selected
      if (selectedStrength) {
        Object.assign(request, { strength: selectedStrength })
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
      
      // Check if we're using mock data or fallback GSN
      if ((response as any).usingMockData) {
        console.warn('Using mock pharmacy data - real API data not available')
        toast('Using mock pharmacy data - real API data not available', {
          icon: '⚠️'
        })
      } else if ((response as any).usingFallbackGsn) {
        console.warn(`Using data from a different medication (GSN: ${(response as any).originalGsn} → 62733)`)
        toast('Showing prices from a similar medication. Actual prices may vary.', {
          icon: '⚠️',
          duration: 6000
        })
      }
      
      // Store brand variations if available
      if (response.brandVariations && Array.isArray(response.brandVariations)) {
        console.log('Setting brand variations:', response.brandVariations)
        setBrandVariations(response.brandVariations)
        
        // If we have brand variations but no selected brand, set the first one as selected
        if (response.brandVariations.length > 0 && !selectedBrand) {
          console.log('Setting initial selected brand:', response.brandVariations[0])
          setSelectedBrand(response.brandVariations[0].type)
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
          setSelectedBrand(defaultVariations[0].type)
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
            zipCode: pharmacy.zipCode || '',
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
          console.log(`Attempting to fetch detailed drug info for GSN: ${gsnNumber}`)
          const detailedInfo = await getDetailedDrugInfo(gsnNumber)
          console.log('Detailed drug info:', detailedInfo)
          
          // Check if we got mock data
          if (detailedInfo.usingMockData) {
            console.warn('Using mock data for detailed drug info - real API data not available')
          }
          
          // Get basic drug info
          console.log(`Attempting to fetch basic drug info for: ${drugName}`)
          const basicInfo = await getDrugInfo(drugName)
          console.log('Basic drug info:', basicInfo)
          
          // Extract filter options from detailed info
          if (detailedInfo) {
            // Extract forms
            if (detailedInfo.forms && Array.isArray(detailedInfo.forms) && detailedInfo.forms.length > 0) {
              console.log(`Found ${detailedInfo.forms.length} forms:`, detailedInfo.forms)
              setAvailableForms(detailedInfo.forms)
              
              // Set default selected form if available
              const selectedFormObj = detailedInfo.forms[0]
              setSelectedForm(selectedFormObj.form)
              
              // If the form has a GSN, update the URL
              if (selectedFormObj.gsn && selectedFormObj.gsn !== gsnNumber) {
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href)
                  url.searchParams.set('gsn', selectedFormObj.gsn.toString())
                  window.history.replaceState({}, '', url.toString())
                }
              }
            } else {
              console.log('No forms found in detailed info, using defaults')
              // Set default forms if none are available
              const defaultForms = [
                { form: 'TABLET', gsn: gsnNumber },
                { form: 'CAPSULE', gsn: gsnNumber }
              ]
              setAvailableForms(defaultForms)
              setSelectedForm(defaultForms[0].form)
            }
            
            // Extract strengths
            if (detailedInfo.strengths && Array.isArray(detailedInfo.strengths) && detailedInfo.strengths.length > 0) {
              console.log(`Found ${detailedInfo.strengths.length} strengths:`, detailedInfo.strengths)
              setAvailableStrengths(detailedInfo.strengths)
              
              // Set default selected strength if available
              const selectedStrengthObj = detailedInfo.strengths[0]
              setSelectedStrength(selectedStrengthObj.strength)
              
              // If the strength has a GSN and it's different from the current GSN, update the URL
              if (selectedStrengthObj.gsn && selectedStrengthObj.gsn !== gsnNumber) {
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href)
                  url.searchParams.set('gsn', selectedStrengthObj.gsn.toString())
                  window.history.replaceState({}, '', url.toString())
                }
              }
            } else {
              console.log('No strengths found in detailed info, using defaults')
              // Set default strengths if none are available
              const defaultStrengths = [
                { strength: '500 mg', gsn: gsnNumber },
                { strength: '250 mg', gsn: gsnNumber }
              ]
              setAvailableStrengths(defaultStrengths)
              setSelectedStrength(defaultStrengths[0].strength)
            }
            
            // Extract quantities
            if (detailedInfo.quantities && Array.isArray(detailedInfo.quantities) && detailedInfo.quantities.length > 0) {
              console.log(`Found ${detailedInfo.quantities.length} quantities:`, detailedInfo.quantities)
              setAvailableQuantities(detailedInfo.quantities)
              
              // Set default selected quantity if available
              const selectedQuantityObj = detailedInfo.quantities[0]
              setSelectedQuantity(`${selectedQuantityObj.quantity} ${selectedQuantityObj.uom}`)
            } else {
              console.log('No quantities found in detailed info, using defaults')
              // Set default quantities if none are available
              const defaultQuantities = [
                { quantity: 30, uom: 'TABLET' },
                { quantity: 60, uom: 'TABLET' },
                { quantity: 90, uom: 'TABLET' }
              ]
              setAvailableQuantities(defaultQuantities)
              setSelectedQuantity(`${defaultQuantities[0].quantity} ${defaultQuantities[0].uom}`)
            }
            
            // Set brand options
            if (detailedInfo.brandName && detailedInfo.genericName && detailedInfo.brandName !== detailedInfo.genericName) {
              // If both brand and generic names are available and different, set up brand variations
              const variations = [
                { name: detailedInfo.brandName, type: 'brand', gsn: gsnNumber },
                { name: detailedInfo.genericName, type: 'generic', gsn: gsnNumber }
              ]
              setBrandVariations(variations)
              
              // Set default selected brand based on the current GSN or preference
              setSelectedBrand(detailedInfo.genericName ? 'generic' : 'brand')
            } else if (detailedInfo.brandName || detailedInfo.genericName) {
              // If only one name is available, use it
              const name = detailedInfo.brandName || detailedInfo.genericName
              const variations = [
                { name, type: 'generic', gsn: gsnNumber }
              ]
              setBrandVariations(variations)
              setSelectedBrand('generic')
            }
          }
          
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
          
          // Fetch pharmacy prices with the current location and GSN
          await fetchPharmacyPrices(userLocation.latitude, userLocation.longitude, searchRadius)
        } catch (error) {
          console.error('Error fetching detailed drug info:', error)
          
          // Fall back to basic drug info
          try {
            console.log(`Falling back to basic drug info for: ${drugName}`)
            const basicInfo = await getDrugInfo(drugName)
            console.log('Basic drug info (fallback):', basicInfo)
            
            // Set default forms, strengths, and quantities
            const defaultForms = [
              { form: 'TABLET', gsn: parseInt(gsn, 10) },
              { form: 'CAPSULE', gsn: parseInt(gsn, 10) }
            ]
            setAvailableForms(defaultForms)
            setSelectedForm(defaultForms[0].form)
            
            const defaultStrengths = [
              { strength: '500 mg', gsn: parseInt(gsn, 10) },
              { strength: '250 mg', gsn: parseInt(gsn, 10) }
            ]
            setAvailableStrengths(defaultStrengths)
            setSelectedStrength(defaultStrengths[0].strength)
            
            const defaultQuantities = [
              { quantity: 30, uom: 'TABLET' },
              { quantity: 60, uom: 'TABLET' },
              { quantity: 90, uom: 'TABLET' }
            ]
            setAvailableQuantities(defaultQuantities)
            setSelectedQuantity(`${defaultQuantities[0].quantity} ${defaultQuantities[0].uom}`)
            
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
            
            // Fetch pharmacy prices with the current location and GSN
            await fetchPharmacyPrices(userLocation.latitude, userLocation.longitude, searchRadius)
          } catch (fallbackError) {
            console.error('Error fetching basic drug info (fallback):', fallbackError)
            
            // Create a minimal drug info object
            const minimalDrugInfo = {
              brandName: drugName,
              genericName: drugName,
              gsn: parseInt(gsn, 10),
              ndcCode: '',
              description: `Information for ${drugName} is currently unavailable.`,
              sideEffects: '',
              dosage: '',
              storage: '',
              contraindications: ''
            }
            
            setDrugInfo(minimalDrugInfo)
            setDrugDetails(minimalDrugInfo)
            
            // Set default forms, strengths, and quantities
            const defaultForms = [
              { form: 'TABLET', gsn: parseInt(gsn, 10) },
              { form: 'CAPSULE', gsn: parseInt(gsn, 10) }
            ]
            setAvailableForms(defaultForms)
            setSelectedForm(defaultForms[0].form)
            
            const defaultStrengths = [
              { strength: '500 mg', gsn: parseInt(gsn, 10) },
              { strength: '250 mg', gsn: parseInt(gsn, 10) }
            ]
            setAvailableStrengths(defaultStrengths)
            setSelectedStrength(defaultStrengths[0].strength)
            
            const defaultQuantities = [
              { quantity: 30, uom: 'TABLET' },
              { quantity: 60, uom: 'TABLET' },
              { quantity: 90, uom: 'TABLET' }
            ]
            setAvailableQuantities(defaultQuantities)
            setSelectedQuantity(`${defaultQuantities[0].quantity} ${defaultQuantities[0].uom}`)
            
            // Set a user-friendly error message
            setError(`We couldn't load detailed information for ${drugName}. Showing basic information instead.`)
          }
        }
      } else {
        // If we don't have a GSN, just get basic drug info
        try {
          console.log(`Attempting to fetch basic drug info for: ${drugName}`)
          const basicInfo = await getDrugInfo(drugName)
          console.log('Basic drug info:', basicInfo)
          
          // Try to find the drug in the search results to get a GSN
          console.log(`Searching for drug: ${drugName} to find GSN`)
          const searchResults = await searchMedications(drugName)
          console.log('Search results:', searchResults)
          
          const matchingDrug = searchResults.find(
            drug => drug.drugName.toLowerCase() === drugName.toLowerCase()
          )
          
          const gsnFromSearch = matchingDrug?.gsn
          console.log(`GSN from search: ${gsnFromSearch || 'not found'}`)
          
          // Set default forms, strengths, and quantities
          const defaultForms = [
            { form: 'TABLET', gsn: gsnFromSearch || 0 },
            { form: 'CAPSULE', gsn: gsnFromSearch || 0 }
          ]
          setAvailableForms(defaultForms)
          setSelectedForm(defaultForms[0].form)
          
          const defaultStrengths = [
            { strength: '500 mg', gsn: gsnFromSearch || 0 },
            { strength: '250 mg', gsn: gsnFromSearch || 0 }
          ]
          setAvailableStrengths(defaultStrengths)
          setSelectedStrength(defaultStrengths[0].strength)
          
          const defaultQuantities = [
            { quantity: 30, uom: 'TABLET' },
            { quantity: 60, uom: 'TABLET' },
            { quantity: 90, uom: 'TABLET' }
          ]
          setAvailableQuantities(defaultQuantities)
          setSelectedQuantity(`${defaultQuantities[0].quantity} ${defaultQuantities[0].uom}`)
          
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
        } catch (error) {
          console.error('Error fetching basic drug info:', error)
          
          // Create a minimal drug info object
          const minimalDrugInfo = {
            brandName: drugName,
            genericName: drugName,
            gsn: 0,
            ndcCode: '',
            description: `Information for ${drugName} is currently unavailable.`,
            sideEffects: '',
            dosage: '',
            storage: '',
            contraindications: ''
          }
          
          setDrugInfo(minimalDrugInfo)
          setDrugDetails(minimalDrugInfo)
          
          // Set default forms, strengths, and quantities
          const defaultForms = [
            { form: 'TABLET', gsn: 0 },
            { form: 'CAPSULE', gsn: 0 }
          ]
          setAvailableForms(defaultForms)
          setSelectedForm(defaultForms[0].form)
          
          const defaultStrengths = [
            { strength: '500 mg', gsn: 0 },
            { strength: '250 mg', gsn: 0 }
          ]
          setAvailableStrengths(defaultStrengths)
          setSelectedStrength(defaultStrengths[0].strength)
          
          const defaultQuantities = [
            { quantity: 30, uom: 'TABLET' },
            { quantity: 60, uom: 'TABLET' },
            { quantity: 90, uom: 'TABLET' }
          ]
          setAvailableQuantities(defaultQuantities)
          setSelectedQuantity(`${defaultQuantities[0].quantity} ${defaultQuantities[0].uom}`)
          
          // Set a user-friendly error message
          setError(`We couldn't load information for ${drugName}. Please try searching for a different medication.`)
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
      zipCode: pharmacy.zipCode || '',
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

  // Handle search radius change from the dropdown
  const handleSearchRadiusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSearchRadius(parseInt(value, 10));
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

  // Add a useEffect to log pharmacy prices when they change
  useEffect(() => {
    if (pharmacyPrices.length > 0) {
      console.log(`Pharmacy prices updated: ${pharmacyPrices.length} pharmacies available`);
      console.log('First pharmacy:', pharmacyPrices[0]);
      
      // Ensure all pharmacy prices have the required properties
      const validatedPrices = pharmacyPrices.map(pharmacy => {
        // Ensure price is a number
        const price = typeof pharmacy.price === 'number' ? pharmacy.price : 
                     (typeof pharmacy.price === 'string' ? parseFloat(pharmacy.price) : 0);
        
        return {
          ...pharmacy,
          price: price,
          // Ensure other required properties have defaults
          name: pharmacy.name || 'Unknown Pharmacy',
          distance: pharmacy.distance || '0.0 miles',
          address: pharmacy.address || '',
          city: pharmacy.city || '',
          state: pharmacy.state || '',
          zipCode: pharmacy.zipCode || '',
          phone: pharmacy.phone || '',
          latitude: pharmacy.latitude || userLocation.latitude,
          longitude: pharmacy.longitude || userLocation.longitude,
          open24H: !!pharmacy.open24H
        };
      });
      
      // Only update if we need to fix any pharmacy data
      if (JSON.stringify(validatedPrices) !== JSON.stringify(pharmacyPrices)) {
        console.log('Updating pharmacy prices with validated data');
        setPharmacyPrices(validatedPrices);
      }
    }
  }, [pharmacyPrices, userLocation]);
  
  // Add a useEffect to log when the component is about to render pharmacy prices
  useEffect(() => {
    if (!isLoading && !isLoadingPharmacies && pharmacyPrices.length > 0) {
      console.log('Ready to render pharmacy prices:', pharmacyPrices.length);
      
      // Force a re-render of the pharmacy list
      const pharmacyListElement = pharmacyListRef.current;
      if (pharmacyListElement) {
        console.log('Forcing pharmacy list re-render');
        // This will trigger a DOM update
        pharmacyListElement.style.opacity = '0.99';
        setTimeout(() => {
          pharmacyListElement.style.opacity = '1';
        }, 50);
      }
    }
  }, [isLoading, isLoadingPharmacies, pharmacyPrices.length]);

  // Handle form change
  const handleFormChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newForm = e.target.value;
    setSelectedForm(newForm);
    
    // Find the GSN for the selected form if available
    const selectedFormObj = availableForms.find(form => form.form === newForm);
    if (selectedFormObj && selectedFormObj.gsn) {
      // Update the URL with the new GSN
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('gsn', selectedFormObj.gsn.toString());
        window.history.replaceState({}, '', url.toString());
      }
      
      // Refetch drug info with the new GSN
      await fetchDrugInfo();
    }
  };
  
  // Handle strength change
  const handleStrengthChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStrength = e.target.value;
    setSelectedStrength(newStrength);
    
    // Find the GSN for the selected strength if available
    const selectedStrengthObj = availableStrengths.find(strength => strength.strength === newStrength);
    if (selectedStrengthObj && selectedStrengthObj.gsn) {
      // Update the URL with the new GSN
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('gsn', selectedStrengthObj.gsn.toString());
        window.history.replaceState({}, '', url.toString());
      }
      
      // Refetch drug info with the new GSN
      await fetchDrugInfo();
    }
  };
  
  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedQuantity(e.target.value);
    // Refetch pharmacy prices with the new quantity
    fetchPharmacyPrices(userLocation.latitude, userLocation.longitude, searchRadius);
  };
  
  // Handle brand change
  const handleBrandChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBrand = e.target.value;
    setSelectedBrand(newBrand);
    
    // If we have brand variations, find the matching one and update GSN
    if (brandVariations.length > 0) {
      const selectedVariation = brandVariations.find(
        variation => variation.type === newBrand || variation.name.toLowerCase() === newBrand.toLowerCase()
      );
      
      if (selectedVariation && selectedVariation.gsn) {
        // Update the URL with the new GSN
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('gsn', selectedVariation.gsn.toString());
          window.history.replaceState({}, '', url.toString());
        }
        
        // Refetch drug info with the new GSN
        await fetchDrugInfo();
      }
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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

          {/* Medication Form Selectors */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Brand</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedBrand}
                  onChange={handleBrandChange}
                  disabled={isLoading || brandVariations.length === 0}
                >
                  {brandVariations.map((variation, index) => (
                    <option key={`brand-${index}`} value={variation.type}>
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
                  {availableForms.length > 0 ? (
                    availableForms.map((form, index) => (
                      <option key={`form-${index}`} value={form.form}>
                        {form.form}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="CAPSULE">CAPSULE</option>
                      <option value="TABLET">TABLET</option>
                      <option value="LIQUID">LIQUID</option>
                    </>
                  )}
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
                  {availableStrengths.length > 0 ? (
                    availableStrengths.map((strength, index) => (
                      <option key={`strength-${index}`} value={strength.strength}>
                        {strength.strength}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="500 mg">500 mg</option>
                      <option value="250 mg">250 mg</option>
                      <option value="125 mg">125 mg</option>
                    </>
                  )}
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
                  {availableQuantities.length > 0 ? (
                    availableQuantities.map((qty, index) => (
                      <option key={`qty-${index}`} value={`${qty.quantity} ${qty.uom}`}>
                        {qty.quantity} {qty.uom}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="21 CAPSULE">21 CAPSULE</option>
                      <option value="30 CAPSULE">30 CAPSULE</option>
                      <option value="60 CAPSULE">60 CAPSULE</option>
                    </>
                  )}
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

          {/* Add the search options section back */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6 mt-8 mb-8 border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Search Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <div className="flex items-center">
                  <input 
                    type="text" 
                    className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter ZIP code"
                    value={userLocation.zipCode}
                    onChange={(e) => setUserLocation({ ...userLocation, zipCode: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleZipCodeSubmit();
                      }
                    }}
                  />
                  <button 
                    className="ml-2 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    onClick={handleZipCodeSubmit}
                    disabled={isLoadingPharmacies}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center mt-2">
                  <button 
                    className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
                    onClick={getUserLocation}
                    disabled={isLoadingPharmacies}
                  >
                    Use my location
                  </button>
                  {isLoadingPharmacies && (
                    <div className="ml-2 inline-block animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-500"></div>
                  )}
                </div>
              </div>
              
              {/* Search Radius */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Search Radius</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchRadius}
                  onChange={handleSearchRadiusChange}
                  disabled={isLoadingPharmacies}
                >
                  <option value="5">5 miles</option>
                  <option value="10">10 miles</option>
                  <option value="15">15 miles</option>
                  <option value="20">20 miles</option>
                  <option value="25">25 miles</option>
                </select>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
} 