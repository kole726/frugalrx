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
  const [displayedDrugName, setDisplayedDrugName] = useState<string>('')
  const [forceUpdate, setForceUpdate] = useState(0)
  const [lastSelectedBrandType, setLastSelectedBrandType] = useState<string>('')
  const [lastSelectedBrandName, setLastSelectedBrandName] = useState<string>('')
  
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

  // Modify the fetchDrugInfo function to properly populate dropdowns based on API data
  const fetchDrugInfo = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const drugName = decodeURIComponent(params.name)
      console.log(`Fetching drug info for: ${drugName}, GSN: ${gsn || 'not provided'}`)
      
      // First, get drug pricing by name to get the GSN and pricing information
      console.log(`Getting drug pricing for: ${drugName} at location: ${userLocation.latitude}, ${userLocation.longitude}`)
      
      const pricingData = await getDrugPrices({
        drugName: drugName,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius: searchRadius,
        quantity: parseInt(selectedQuantity.split(' ')[0], 10) || 30,
        customizedQuantity: true
      })
      
      console.log('Drug pricing data:', pricingData)
      
      // Extract GSN from pricing data
      const gsnFromPricing = (pricingData as any).drug?.gsn || (pricingData as any).gsn
      console.log(`GSN from pricing data: ${gsnFromPricing || 'not found'}`)
      
      // Set pharmacy prices from pricing data
      if ((pricingData as any).pharmacyPrices && (pricingData as any).pharmacyPrices.length > 0) {
        console.log(`Found ${(pricingData as any).pharmacyPrices.length} pharmacy prices`)
        setPharmacyPrices((pricingData as any).pharmacyPrices)
      } else if (pricingData.pharmacies && pricingData.pharmacies.length > 0) {
        console.log(`Found ${pricingData.pharmacies.length} pharmacies`)
        setPharmacyPrices(pricingData.pharmacies)
      } else {
        console.log('No pharmacy prices found')
        setPharmacyPrices([])
      }
      
      // If we have a GSN from pricing or URL, use it to get detailed drug info
      const gsnToUse = gsn ? parseInt(gsn, 10) : gsnFromPricing
      
      if (gsnToUse) {
        try {
          // Get detailed drug info using GSN
          console.log(`Attempting to fetch detailed drug info for GSN: ${gsnToUse}`)
          const detailedInfo = await getDetailedDrugInfo(gsnToUse)
          console.log('Detailed drug info:', detailedInfo)
          
          // Check if we got mock data
          if (detailedInfo.usingMockData) {
            console.warn('Using mock data for detailed drug info - real API data not available')
          }
          
          // Set drug info from detailed info
          const brandName = detailedInfo.brandName || (pricingData as any).drug?.medName || drugName
          const genericName = detailedInfo.genericName || drugName
          
          setDrugInfo({
            brandName,
            genericName,
            gsn: gsnToUse,
            ndcCode: detailedInfo.ndcCode || (pricingData as any).drug?.ndcCode || '',
          })
          
          // Set drug details from detailed info
          setDrugDetails(detailedInfo)
          
          // ===== BRAND DROPDOWN POPULATION =====
          // Create brand variations based on API data
          let variations = []
          
          // Start with the main drug (generic/brand)
          const mainDrugBgFlag = (pricingData as any).drug?.bgFlag || '';
          const isMainDrugBrand = mainDrugBgFlag === 'B';
          
          // Add the current brand/generic as options
          if (brandName && genericName && brandName !== genericName) {
            variations.push(
              {
                name: isMainDrugBrand ? `${brandName} (Brand)` : brandName,
                type: 'brand',
                gsn: gsnToUse,
                selected: isMainDrugBrand,
                isBrand: true
              },
              {
                name: !isMainDrugBrand ? `${genericName} (Generic)` : genericName,
                type: 'generic',
                gsn: gsnToUse,
                selected: !isMainDrugBrand,
                isBrand: false
              }
            )
          } else {
            // If we only have one name, create a single variation
            const name = brandName || genericName || drugName
            const displayName = isMainDrugBrand ? `${name} (Brand)` : `${name} (Generic)`
            variations.push({
              name: displayName,
              type: isMainDrugBrand ? 'brand' : 'generic',
              gsn: gsnToUse,
              selected: true,
              isBrand: isMainDrugBrand
            })
          }
          
          // Check if there are alternate drugs in the pricing data
          if ((pricingData as any).alternateDrugs && Array.isArray((pricingData as any).alternateDrugs)) {
            console.log('Found alternate drugs:', (pricingData as any).alternateDrugs);
            
            // Add alternate drugs to variations
            (pricingData as any).alternateDrugs.forEach((altDrug: any, index: number) => {
              if (altDrug.medName || altDrug.genericName) {
                const isBrand = altDrug.bgFlag === 'B';
                const drugName = altDrug.medName || altDrug.genericName;
                const suffix = isBrand ? ' (Brand)' : ' (Generic)';
                
                variations.push({
                  name: `${drugName}${suffix}`,
                  type: isBrand ? `alternate-brand-${index}` : `alternate-generic-${index}`,
                  gsn: altDrug.gsn || gsnToUse,
                  selected: altDrug.selected || false,
                  isBrand: isBrand
                });
              }
            });
          }
          
          console.log('Setting brand variations:', variations)
          setBrandVariations(variations)
          
          // Check if we have a last selected brand that matches one of the variations
          if (lastSelectedBrandName) {
            console.log(`Looking for last selected brand: ${lastSelectedBrandName}`);
            
            // Try to find the variation that matches the last selected brand name
            const matchingVariation = variations.find(v => 
              v.name === lastSelectedBrandName || 
              v.type === lastSelectedBrandType
            );
            
            if (matchingVariation) {
              console.log(`Found matching variation for last selected brand: ${matchingVariation.name}`);
              setSelectedBrand(matchingVariation.type);
              setDisplayedDrugName(matchingVariation.name);
            } else {
              console.log(`No matching variation found for last selected brand: ${lastSelectedBrandName}`);
              
              // Find the selected variation from the API
              const selectedVariation = variations.find(v => v.selected === true);
              if (selectedVariation) {
                console.log(`Using API-selected brand: ${selectedVariation.name}`);
                setSelectedBrand(selectedVariation.type);
                setDisplayedDrugName(selectedVariation.name);
              } else {
                // Default to the first variation if none is selected
                console.log(`No selected brand found, using first variation: ${variations[0].name}`);
                setSelectedBrand(variations[0].type);
                setDisplayedDrugName(variations[0].name);
              }
            }
          } else {
            // If we don't have a last selected brand, use the one marked as selected in the API
            const selectedVariation = variations.find(v => v.selected === true);
            if (selectedVariation) {
              console.log(`Using API-selected brand: ${selectedVariation.name}`);
              setSelectedBrand(selectedVariation.type);
              setDisplayedDrugName(selectedVariation.name);
            } else {
              // If no variation is marked as selected, use the first one
              console.log(`No selected brand found, using first variation: ${variations[0].name}`);
              setSelectedBrand(variations[0].type);
              setDisplayedDrugName(variations[0].name);
            }
          }
          
          // ===== FORM DROPDOWN POPULATION =====
          // Extract forms from detailed info
          if (detailedInfo.forms && Array.isArray(detailedInfo.forms) && detailedInfo.forms.length > 0) {
            console.log(`Found ${detailedInfo.forms.length} forms:`, detailedInfo.forms);
            
            // Filter forms based on the selected brand's GSN if available
            const currentSelectedBrand = brandVariations.find(v => v.type === selectedBrand);
            const brandGsn = currentSelectedBrand?.gsn;
            
            let relevantForms = detailedInfo.forms;
            if (brandGsn) {
              // Try to find forms specific to this brand's GSN
              const brandSpecificForms = detailedInfo.forms.filter((form: DrugForm) => form.gsn === brandGsn);
              if (brandSpecificForms.length > 0) {
                console.log(`Found ${brandSpecificForms.length} forms specific to brand GSN ${brandGsn}`);
                relevantForms = brandSpecificForms;
              }
            }
            
            setAvailableForms(relevantForms);
            
            // Find the form that is marked as selected in the API
            const selectedForm = relevantForms.find((form: DrugForm) => form.selected === true);
            if (selectedForm) {
              console.log(`Using API-selected form: ${selectedForm.form}`);
              setSelectedForm(selectedForm.form);
            } else {
              // If no form is marked as selected, try to find one that matches the GSN
              const matchingGsnForm = relevantForms.find((form: DrugForm) => form.gsn === gsnToUse);
              if (matchingGsnForm) {
                console.log(`Using form matching GSN ${gsnToUse}: ${matchingGsnForm.form}`);
                setSelectedForm(matchingGsnForm.form);
              } else {
                // If no matching GSN, use the first form
                console.log(`No matching form found for GSN ${gsnToUse}, using first form: ${relevantForms[0].form}`);
                setSelectedForm(relevantForms[0].form);
              }
            }
          } else if (pricingData && (pricingData as any).drug && (pricingData as any).drug.form) {
            // If no forms in detailed info, try to get from pricing data
            console.log('No forms in detailed info, using form from pricing data:', (pricingData as any).drug.form);
            const form = (pricingData as any).drug.form;
            const formObj = { form, gsn: gsnToUse, selected: true };
            setAvailableForms([formObj]);
            setSelectedForm(form);
          } else {
            console.log('No forms found in detailed info, using defaults');
            // Set default forms if none are available
            const defaultForms = [
              { form: 'TABLET', gsn: gsnToUse, selected: true },
              { form: 'CAPSULE', gsn: gsnToUse, selected: false }
            ];
            setAvailableForms(defaultForms);
            setSelectedForm(defaultForms[0].form);
          }
          
          // ===== STRENGTH (DOSAGE) DROPDOWN POPULATION =====
          // Extract strengths from detailed info
          if (detailedInfo.strengths && Array.isArray(detailedInfo.strengths) && detailedInfo.strengths.length > 0) {
            console.log(`Found ${detailedInfo.strengths.length} strengths:`, detailedInfo.strengths);
            
            // Filter strengths based on the selected form and brand if available
            const currentSelectedBrand = brandVariations.find(v => v.type === selectedBrand);
            const brandGsn = currentSelectedBrand?.gsn;
            
            let relevantStrengths = detailedInfo.strengths;
            
            // First try to filter by both form and brand GSN
            if (selectedForm && brandGsn) {
              const formAndBrandStrengths = detailedInfo.strengths.filter((strength: DrugStrength) => {
                // Check if this strength is associated with the selected form
                const matchingForm = detailedInfo.forms?.find((form: DrugForm) => 
                  form.form === selectedForm && form.gsn === strength.gsn
                );
                return matchingForm && strength.gsn === brandGsn;
              });
              
              if (formAndBrandStrengths.length > 0) {
                console.log(`Found ${formAndBrandStrengths.length} strengths specific to form ${selectedForm} and brand GSN ${brandGsn}`);
                relevantStrengths = formAndBrandStrengths;
              }
            }
            
            // If we couldn't filter by both, try just by brand GSN
            if (relevantStrengths.length === detailedInfo.strengths.length && brandGsn) {
              const brandSpecificStrengths = detailedInfo.strengths.filter((strength: DrugStrength) => strength.gsn === brandGsn);
              if (brandSpecificStrengths.length > 0) {
                console.log(`Found ${brandSpecificStrengths.length} strengths specific to brand GSN ${brandGsn}`);
                relevantStrengths = brandSpecificStrengths;
              }
            }
            
            setAvailableStrengths(relevantStrengths);
            
            // Find the strength that is marked as selected in the API
            const selectedStrength = relevantStrengths.find((strength: DrugStrength) => strength.selected === true);
            if (selectedStrength) {
              console.log(`Using API-selected strength: ${selectedStrength.strength}`);
              setSelectedStrength(selectedStrength.strength);
            } else {
              // If no strength is marked as selected, try to find one that matches the GSN
              const matchingGsnStrength = relevantStrengths.find((strength: DrugStrength) => strength.gsn === gsnToUse);
              if (matchingGsnStrength) {
                console.log(`Using strength matching GSN ${gsnToUse}: ${matchingGsnStrength.strength}`);
                setSelectedStrength(matchingGsnStrength.strength);
              } else {
                // If no matching GSN, use the first strength
                console.log(`No matching strength found for GSN ${gsnToUse}, using first strength: ${relevantStrengths[0].strength}`);
                setSelectedStrength(relevantStrengths[0].strength);
              }
            }
          } else if (pricingData && (pricingData as any).drug && (pricingData as any).drug.strength) {
            // If no strengths in detailed info, try to get from pricing data
            console.log('No strengths in detailed info, using strength from pricing data:', (pricingData as any).drug.strength);
            const strength = (pricingData as any).drug.strength;
            const strengthObj = { strength, gsn: gsnToUse, selected: true };
            setAvailableStrengths([strengthObj]);
            setSelectedStrength(strength);
          } else {
            console.log('No strengths found in detailed info, using defaults');
            // Set default strengths if none are available
            const defaultStrengths = [
              { strength: '500 mg', gsn: gsnToUse, selected: true },
              { strength: '250 mg', gsn: gsnToUse, selected: false }
            ];
            setAvailableStrengths(defaultStrengths);
            setSelectedStrength(defaultStrengths[0].strength);
          }
          
          // ===== QUANTITY DROPDOWN POPULATION =====
          // Extract quantities from detailed info
          if (detailedInfo.quantities && Array.isArray(detailedInfo.quantities) && detailedInfo.quantities.length > 0) {
            console.log(`Found ${detailedInfo.quantities.length} quantities:`, detailedInfo.quantities);
            
            // Filter quantities based on the selected form, strength, and brand if available
            const currentSelectedBrand = brandVariations.find(v => v.type === selectedBrand);
            const brandGsn = currentSelectedBrand?.gsn;
            
            let relevantQuantities = detailedInfo.quantities;
            
            // First try to filter by form, strength, and brand GSN
            if (selectedForm && selectedStrength && brandGsn) {
              const specificQuantities = detailedInfo.quantities.filter((qty: DrugQuantity) => {
                // Check if this quantity is associated with the selected form and strength
                const matchingStrength = detailedInfo.strengths?.find((strength: DrugStrength) => 
                  strength.strength === selectedStrength && 
                  strength.gsn === brandGsn
                );
                
                return qty.uom.toUpperCase() === selectedForm.toUpperCase() && matchingStrength;
              });
              
              if (specificQuantities.length > 0) {
                console.log(`Found ${specificQuantities.length} quantities specific to form ${selectedForm}, strength ${selectedStrength}, and brand`);
                relevantQuantities = specificQuantities;
              }
            }
            
            // If we couldn't filter by all criteria, try just by form
            if (relevantQuantities.length === detailedInfo.quantities.length && selectedForm) {
              const formSpecificQuantities = detailedInfo.quantities.filter((qty: DrugQuantity) => 
                qty.uom.toUpperCase() === selectedForm.toUpperCase()
              );
              
              if (formSpecificQuantities.length > 0) {
                console.log(`Found ${formSpecificQuantities.length} quantities specific to form ${selectedForm}`);
                relevantQuantities = formSpecificQuantities;
              }
            }
            
            setAvailableQuantities(relevantQuantities);
            
            // Find the quantity that is marked as selected in the API
            const selectedQuantity = relevantQuantities.find((qty: DrugQuantity) => qty.selected === true);
            if (selectedQuantity) {
              console.log(`Using API-selected quantity: ${selectedQuantity.quantity} ${selectedQuantity.uom}`);
              setSelectedQuantity(`${selectedQuantity.quantity} ${selectedQuantity.uom}`);
            } else {
              // If no quantity is marked as selected, try to find one that matches the form
              const matchingFormQuantity = relevantQuantities.find((qty: DrugQuantity) => 
                qty.uom.toUpperCase() === selectedForm.toUpperCase()
              );
              if (matchingFormQuantity) {
                console.log(`Using quantity matching form ${selectedForm}: ${matchingFormQuantity.quantity} ${matchingFormQuantity.uom}`);
                setSelectedQuantity(`${matchingFormQuantity.quantity} ${matchingFormQuantity.uom}`);
              } else {
                // If no matching form, use the first quantity
                const firstQuantity = relevantQuantities[0];
                console.log(`No matching quantity found for form ${selectedForm}, using first quantity: ${firstQuantity.quantity} ${firstQuantity.uom}`);
                setSelectedQuantity(`${firstQuantity.quantity} ${firstQuantity.uom}`);
              }
            }
          } else if (pricingData && (pricingData as any).drug && (pricingData as any).drug.packageSize) {
            // If no quantities in detailed info, try to get from pricing data
            console.log('No quantities in detailed info, using package size from pricing data:', (pricingData as any).drug.packageSize);
            const packageSize = (pricingData as any).drug.packageSize;
            // Try to parse the package size into quantity and UOM
            const match = packageSize.match(/^(\d+)\s+(.+)$/);
            if (match) {
              const [_, quantity, uom] = match;
              const quantityObj = { quantity: parseInt(quantity), uom, selected: true };
              setAvailableQuantities([quantityObj]);
              setSelectedQuantity(packageSize);
            } else {
              // If we can't parse it, use a default
              setAvailableQuantities([{ quantity: 30, uom: selectedForm || 'TABLET', selected: true }]);
              setSelectedQuantity(`30 ${selectedForm || 'TABLET'}`);
            }
          } else {
            console.log('No quantities found in detailed info, using defaults');
            // Set default quantities if none are available
            const defaultQuantities = [
              { quantity: 30, uom: selectedForm || 'TABLET', selected: true },
              { quantity: 60, uom: selectedForm || 'TABLET', selected: false },
              { quantity: 90, uom: selectedForm || 'TABLET', selected: false }
            ];
            setAvailableQuantities(defaultQuantities);
            setSelectedQuantity(`${defaultQuantities[0].quantity} ${defaultQuantities[0].uom}`);
          }
        } catch (error) {
          console.error('Error fetching detailed drug info:', error)
          setError('Error fetching detailed drug information')
        }
      } else {
        // If we couldn't get a GSN, set up default values
        console.log('No GSN found, using basic drug info')
        
        setDrugInfo({
          brandName: (pricingData as any).drug?.medName || drugName,
          genericName: drugName,
          gsn: 0,
          ndcCode: (pricingData as any).drug?.ndcCode || '',
        })
        
        // Create brand variations from the drug and alternateDrugs
        let variations = [];
        
        // Add the main drug
        variations.push({
          name: (pricingData as any).drug?.medName || drugName,
          type: 'brand',
          gsn: 0,
          selected: true
        });
        
        // Add alternate drugs if available
        if ((pricingData as any).alternateDrugs && Array.isArray((pricingData as any).alternateDrugs)) {
          (pricingData as any).alternateDrugs.forEach((altDrug: any, index: number) => {
            if (altDrug.medName) {
              const isBrand = altDrug.bgFlag === 'B';
              const suffix = isBrand ? ' (Brand)' : ' (Generic)';
              
              variations.push({
                name: `${altDrug.medName}${suffix}`,
                type: `alternate-${index}`,
                gsn: altDrug.gsn || 0,
                selected: altDrug.selected || false
              });
            }
          });
        }
        
        console.log('Setting brand variations from basic info:', variations);
        setBrandVariations(variations);
        setSelectedBrand(variations[0].type);
        setDisplayedDrugName(variations[0].name);
        
        // Set default forms, strengths, and quantities
        // Try to get these from the pricing data if available
        if ((pricingData as any).forms && Array.isArray((pricingData as any).forms)) {
          setAvailableForms((pricingData as any).forms);
          const selectedForm = (pricingData as any).forms.find((form: any) => form.selected === true);
          setSelectedForm(selectedForm ? selectedForm.form : (pricingData as any).forms[0].form);
        } else {
          const defaultForms = [
            { form: 'TABLET', gsn: 0, selected: true },
            { form: 'CAPSULE', gsn: 0, selected: false }
          ];
          setAvailableForms(defaultForms);
          setSelectedForm(defaultForms[0].form);
        }
        
        if ((pricingData as any).strengths && Array.isArray((pricingData as any).strengths)) {
          setAvailableStrengths((pricingData as any).strengths);
          const selectedStrength = (pricingData as any).strengths.find((strength: any) => strength.selected === true);
          setSelectedStrength(selectedStrength ? selectedStrength.strength : (pricingData as any).strengths[0].strength);
        } else {
          const defaultStrengths = [
            { strength: '500 mg', gsn: 0, selected: true },
            { strength: '250 mg', gsn: 0, selected: false }
          ];
          setAvailableStrengths(defaultStrengths);
          setSelectedStrength(defaultStrengths[0].strength);
        }
        
        if ((pricingData as any).quantities && Array.isArray((pricingData as any).quantities)) {
          setAvailableQuantities((pricingData as any).quantities);
          const selectedQuantity = (pricingData as any).quantities.find((qty: any) => qty.selected === true);
          if (selectedQuantity) {
            setSelectedQuantity(`${selectedQuantity.quantity} ${selectedQuantity.uom}`);
          } else {
            setSelectedQuantity(`${(pricingData as any).quantities[0].quantity} ${(pricingData as any).quantities[0].uom}`);
          }
        } else {
          const defaultQuantities = [
            { quantity: 30, uom: 'TABLET', selected: true },
            { quantity: 60, uom: 'TABLET', selected: false },
            { quantity: 90, uom: 'TABLET', selected: false }
          ];
          setAvailableQuantities(defaultQuantities);
          setSelectedQuantity(`${defaultQuantities[0].quantity} ${defaultQuantities[0].uom}`);
        }
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error('Error in fetchDrugInfo:', error)
      setError('Error fetching drug information')
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

  // Handle brand change
  const handleBrandChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBrand = e.target.value;
    setSelectedBrand(newBrand);
    console.log(`Brand dropdown changed to: ${newBrand}`);
    
    // If we have brand variations, find the matching one and update GSN
    if (brandVariations.length > 0) {
      const selectedVariation = brandVariations.find(
        variation => variation.type === newBrand
      );
      
      if (selectedVariation && selectedVariation.gsn) {
        console.log(`Brand changed to ${selectedVariation.name}, GSN: ${selectedVariation.gsn}`);
        
        // Store the selected brand name to use after fetchDrugInfo completes
        const selectedBrandName = selectedVariation.name;
        console.log(`Storing selected brand name: ${selectedBrandName}`);
        
        // Save the selected brand type and name for later use
        setLastSelectedBrandType(newBrand);
        setLastSelectedBrandName(selectedBrandName);
        
        // Update page title to match selected brand
        setDisplayedDrugName(selectedBrandName);
        
        // Update the URL with the new GSN
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('gsn', selectedVariation.gsn.toString());
          
          // If this is an alternate drug, we might need to update the drug name in the URL
          if (newBrand.startsWith('alternate-') && selectedVariation.name) {
            // Extract the drug name from the variation name (remove the suffix part)
            const drugName = selectedVariation.name.replace(/ \((Brand|Generic)\)$/, '');
            
            // Update the URL path to reflect the new drug name
            const pathParts = window.location.pathname.split('/');
            pathParts[pathParts.length - 1] = encodeURIComponent(drugName);
            url.pathname = pathParts.join('/');
            
            console.log(`Updating URL for alternate drug: ${drugName}, GSN: ${selectedVariation.gsn}`);
          }
          
          window.history.replaceState({}, '', url.toString());
        }
        
        // Mark this brand as selected and others as not selected
        const updatedVariations = brandVariations.map(variation => ({
          ...variation,
          selected: variation.type === newBrand
        }));
        setBrandVariations(updatedVariations);
        
        // Clear any previous selections for form, strength, and quantity
        // This ensures we'll get fresh data for the new brand
        setSelectedForm('');
        setSelectedStrength('');
        setSelectedQuantity('');
        
        // Refetch drug info with the new GSN
        // This will update all dropdowns (form, strength, quantity) based on the new GSN
        await fetchDrugInfo();
        
        // Set the displayed drug name AFTER fetchDrugInfo completes
        // This ensures it won't be overwritten by the fetchDrugInfo function
        console.log(`Setting displayed drug name to: ${selectedBrandName}`);
        setDisplayedDrugName(selectedBrandName);
        
        // Force a re-render to ensure the H1 title updates
        setForceUpdate(prev => prev + 1);
        
        // Log the current state after update
        setTimeout(() => {
          console.log(`Current displayed drug name (after timeout): ${displayedDrugName}`);
          console.log(`Available forms for ${selectedBrandName}:`, availableForms);
          console.log(`Available strengths for ${selectedBrandName}:`, availableStrengths);
          console.log(`Available quantities for ${selectedBrandName}:`, availableQuantities);
        }, 100);
      }
    }
  };

  // Handle form change
  const handleFormChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newForm = e.target.value;
    setSelectedForm(newForm);
    console.log(`Form changed to ${newForm}`);
    
    // Find the GSN for the selected form if available
    const selectedFormObj = availableForms.find(form => form.form === newForm);
    if (selectedFormObj && selectedFormObj.gsn) {
      console.log(`Form changed to ${newForm}, GSN: ${selectedFormObj.gsn}`);
      
      // Update the URL with the new GSN
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('gsn', selectedFormObj.gsn.toString());
        window.history.replaceState({}, '', url.toString());
      }
      
      // Mark this form as selected and others as not selected
      const updatedForms = availableForms.map(form => ({
        ...form,
        selected: form.form === newForm
      }));
      setAvailableForms(updatedForms);
      
      // Preserve the selected brand when refetching drug info
      const currentSelectedBrand = brandVariations.find(v => v.type === selectedBrand);
      if (currentSelectedBrand) {
        setLastSelectedBrandType(currentSelectedBrand.type);
        setLastSelectedBrandName(currentSelectedBrand.name);
      }
      
      // Clear strength and quantity selections to ensure we get fresh data for the new form
      setSelectedStrength('');
      setSelectedQuantity('');
      
      // Refetch drug info with the new GSN
      // This will update all dropdowns (form, strength, quantity) based on the new GSN
      await fetchDrugInfo();
      
      // Log the available options after update
      setTimeout(() => {
        console.log(`Available strengths for form ${newForm}:`, availableStrengths);
        console.log(`Available quantities for form ${newForm}:`, availableQuantities);
      }, 100);
    }
  };
  
  // Handle strength change
  const handleStrengthChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStrength = e.target.value;
    setSelectedStrength(newStrength);
    console.log(`Strength changed to ${newStrength}`);
    
    // Find the GSN for the selected strength if available
    const selectedStrengthObj = availableStrengths.find(strength => strength.strength === newStrength);
    if (selectedStrengthObj && selectedStrengthObj.gsn) {
      console.log(`Strength changed to ${newStrength}, GSN: ${selectedStrengthObj.gsn}`);
      
      // Update the URL with the new GSN
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('gsn', selectedStrengthObj.gsn.toString());
        window.history.replaceState({}, '', url.toString());
      }
      
      // Mark this strength as selected and others as not selected
      const updatedStrengths = availableStrengths.map(strength => ({
        ...strength,
        selected: strength.strength === newStrength
      }));
      setAvailableStrengths(updatedStrengths);
      
      // Preserve the selected brand when refetching drug info
      const currentSelectedBrand = brandVariations.find(v => v.type === selectedBrand);
      if (currentSelectedBrand) {
        setLastSelectedBrandType(currentSelectedBrand.type);
        setLastSelectedBrandName(currentSelectedBrand.name);
      }
      
      // Clear quantity selection to ensure we get fresh data for the new strength
      setSelectedQuantity('');
      
      // Refetch drug info with the new GSN
      // This will update all dropdowns (form, strength, quantity) based on the new GSN
      await fetchDrugInfo();
      
      // Log the available options after update
      setTimeout(() => {
        console.log(`Available quantities for strength ${newStrength}:`, availableQuantities);
      }, 100);
    }
  };
  
  // Handle quantity change
  const handleQuantityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newQuantity = e.target.value;
    console.log(`Quantity changed to ${newQuantity}`);
    setSelectedQuantity(newQuantity);
    
    // Extract quantity value and unit
    const quantityParts = newQuantity.split(' ');
    const quantityValue = parseInt(quantityParts[0], 10);
    
    if (!isNaN(quantityValue)) {
      // Update the URL with the new quantity
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('quantity', quantityValue.toString());
        window.history.replaceState({}, '', url.toString());
      }
      
      // Mark this quantity as selected and others as not selected
      const updatedQuantities = availableQuantities.map(qty => ({
        ...qty,
        selected: `${qty.quantity} ${qty.uom}` === newQuantity
      }));
      setAvailableQuantities(updatedQuantities);
      
      // Preserve the selected brand when refetching drug info
      const currentSelectedBrand = brandVariations.find(v => v.type === selectedBrand);
      if (currentSelectedBrand) {
        setLastSelectedBrandType(currentSelectedBrand.type);
        setLastSelectedBrandName(currentSelectedBrand.name);
      }
      
      // Preserve the selected form and strength
      const currentForm = selectedForm;
      const currentStrength = selectedStrength;
      
      // Refetch drug info with the new quantity
      await fetchDrugInfo();
      
      // Log the current selections after update
      setTimeout(() => {
        console.log(`Current selections after quantity change:`, {
          brand: lastSelectedBrandName,
          form: selectedForm,
          strength: selectedStrength,
          quantity: selectedQuantity
        });
      }, 100);
    } else {
      console.error(`Invalid quantity value: ${newQuantity}`);
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

  // Effect to update document title when displayedDrugName changes
  useEffect(() => {
    if (displayedDrugName) {
      console.log(`displayedDrugName changed to: ${displayedDrugName}`);
      // You could also update the document title here if needed
      // document.title = displayedDrugName;
    }
  }, [displayedDrugName]);

  // Log before rendering
  console.log(`Rendering with displayed drug name: ${displayedDrugName}, forceUpdate: ${forceUpdate}`);

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
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
            key={`title-${forceUpdate}`}
          >
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {displayedDrugName || (drugInfo?.brandName !== drugInfo?.genericName ? 
                (selectedBrand === 'brand' ? `${drugInfo?.brandName} (Brand)` : `${drugInfo?.genericName} (Generic)`) : 
                drugInfo?.brandName || drugInfo?.genericName || params.name)}
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
                <p className="text-xs text-gray-500 mt-1">GSN: {gsn || 'N/A'}</p>
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
          </motion.div>
        </>
      )}
    </div>
  )
} 