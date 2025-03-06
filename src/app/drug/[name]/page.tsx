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
          dataProcessed = true;
        }
        
        // Process forms if available
        if (apiResponse.forms && Array.isArray(apiResponse.forms) && apiResponse.forms.length > 0) {
          console.log('Setting available forms from API response:', apiResponse.forms);
          
          // Map the forms to the expected format
          const formattedForms = apiResponse.forms.map((form: any) => ({
            form: form.form,
            gsn: form.gsn,
            selected: form.selected || false
          }));
          
          setAvailableForms(formattedForms);
          
          // Set default selected form (either the one marked as selected or the first one)
          const defaultForm = formattedForms.find((form: any) => form.selected) || formattedForms[0];
          if (defaultForm && defaultForm.form !== selectedForm) {
            console.log('Setting default form from API:', defaultForm.form);
            setSelectedForm(defaultForm.form);
          }
          dataProcessed = true;
        }
        
        // Process strengths if available
        if (apiResponse.strengths && Array.isArray(apiResponse.strengths) && apiResponse.strengths.length > 0) {
          console.log('Setting available strengths from API response:', apiResponse.strengths);
          
          // Map the strengths to the expected format
          const formattedStrengths = apiResponse.strengths.map((strength: any) => ({
            strength: strength.strength,
            gsn: strength.gsn,
            selected: strength.selected || false
          }));
          
          setAvailableStrengths(formattedStrengths);
          
          // Set default selected strength (either the one marked as selected or the first one)
          const defaultStrength = formattedStrengths.find((strength: any) => strength.selected) || formattedStrengths[0];
          if (defaultStrength && defaultStrength.strength !== selectedStrength) {
            console.log('Setting default strength from API:', defaultStrength.strength);
            setSelectedStrength(defaultStrength.strength);
          }
          dataProcessed = true;
        }
        
        // Process quantities if available
        if (apiResponse.quantities && Array.isArray(apiResponse.quantities) && apiResponse.quantities.length > 0) {
          console.log('Setting available quantities from API response:', apiResponse.quantities);
          
          // Map the quantities to the expected format
          const formattedQuantities = apiResponse.quantities.map((qty: any) => ({
            quantity: qty.quantity,
            uom: qty.uom,
            selected: qty.selected || false
          }));
          
          setAvailableQuantities(formattedQuantities);
          
          // Set default selected quantity (either the one marked as selected or the first one)
          const defaultQuantity = formattedQuantities.find((qty: any) => qty.selected) || formattedQuantities[0];
          if (defaultQuantity) {
            const quantityString = `${defaultQuantity.quantity} ${defaultQuantity.uom}`;
            if (quantityString !== selectedQuantity) {
              console.log('Setting default quantity from API:', quantityString);
              setSelectedQuantity(quantityString);
            }
          }
          dataProcessed = true;
        }
        
        // Process alternate drugs (brands) if available
        if (apiResponse.alternateDrugs && Array.isArray(apiResponse.alternateDrugs) && apiResponse.alternateDrugs.length > 0) {
          console.log('Setting available brands from API response:', apiResponse.alternateDrugs);
          
          // Map the alternate drugs to the expected format for brand variations
          const formattedBrands = apiResponse.alternateDrugs.map((drug: any) => ({
            name: drug.medName,
            type: drug.bgFlag === 'G' ? 'generic' : 'brand',
            gsn: drug.gsn || (apiResponse.drug && apiResponse.drug.gsn) || undefined,
            selected: drug.selected || false
          }));
          
          setBrandVariations(formattedBrands);
          
          // Set default selected brand (either the one marked as selected or the first one)
          const defaultBrand = formattedBrands.find((brand: any) => brand.selected) || formattedBrands[0];
          if (defaultBrand && defaultBrand.type !== selectedBrand) {
            console.log('Setting default brand from API:', defaultBrand.type);
            setSelectedBrand(defaultBrand.type);
          }
          dataProcessed = true;
        }
        
        // If we processed some data but didn't find pharmacy prices, set a specific error
        if (dataProcessed && pharmacyPrices.length === 0) {
          console.log('Found drug information but no pharmacy prices');
          setError('No pharmacy prices found for this medication in your area. Try increasing the search radius or try a different medication.');
        }
        // If we didn't process any data at all, set a more general error
        else if (!dataProcessed) {
          console.log('No usable data found in API response');
          setError('Could not load drug information. Please try again later or search for a different medication.');
        }
        // If we have data and pharmacy prices, clear any errors
        else {
          setError(null);
        }
      }
    } catch (error) {
      console.error('Error fetching pharmacy prices:', error);
      setError('Error fetching pharmacy prices. Please try again later.');
      setPharmacyPrices([]);
      
      // Try to fetch basic drug info as a fallback
      try {
        const drugName = decodeURIComponent(params.name);
        console.log(`Attempting to fetch basic drug info for: ${drugName} as fallback`);
        const basicInfo = await getDrugInfo(drugName);
        
        if (basicInfo) {
          console.log('Successfully fetched basic drug info as fallback');
          setDrugInfo({
            brandName: basicInfo.brandName || drugName,
            genericName: basicInfo.genericName || drugName,
            gsn: basicInfo.gsn || 0,
            ndcCode: basicInfo.ndcCode || '',
            description: basicInfo.description || '',
            sideEffects: basicInfo.sideEffects || '',
            dosage: basicInfo.dosage || '',
            storage: basicInfo.storage || '',
            contraindications: basicInfo.contraindications || ''
          });
          setDrugDetails(basicInfo);
        }
      } catch (fallbackError) {
        console.error('Error fetching basic drug info as fallback:', fallbackError);
      }
    } finally {
      setIsLoadingPharmacies(false);
    }
  };

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
          
          // Store the detailed info in state
          setDetailedInfo(detailedInfo)
          
          // Check if we got mock data
          if (detailedInfo.usingMockData) {
            console.warn('Using mock data for detailed drug info - real API data not available')
          }
          
          // Get basic drug info
          console.log(`Attempting to fetch basic drug info for: ${drugName}`)
          const basicInfo = await getDrugInfo(drugName)
          console.log('Basic drug info:', basicInfo)
          
          // Set drug details
          setDrugDetails(basicInfo)
          
          // Extract available forms, strengths, and quantities from the detailed info
          if (detailedInfo.forms && Array.isArray(detailedInfo.forms)) {
            console.log('Setting available forms:', detailedInfo.forms)
            setAvailableForms(detailedInfo.forms.filter(form => form.selected === true).length > 0 
              ? detailedInfo.forms.filter(form => form.selected === true)
              : detailedInfo.forms)
            
            // Set default selected form
            const defaultForm = detailedInfo.forms.find(form => form.selected === true) || detailedInfo.forms[0]
            if (defaultForm) {
              console.log('Setting default form:', defaultForm.form)
              setSelectedForm(defaultForm.form)
            }
          }
          
          if (detailedInfo.strengths && Array.isArray(detailedInfo.strengths)) {
            console.log('Setting available strengths:', detailedInfo.strengths)
            setAvailableStrengths(detailedInfo.strengths.filter(strength => strength.selected === true).length > 0
              ? detailedInfo.strengths.filter(strength => strength.selected === true)
              : detailedInfo.strengths)
            
            // Set default selected strength
            const defaultStrength = detailedInfo.strengths.find(strength => strength.selected === true) || detailedInfo.strengths[0]
            if (defaultStrength) {
              console.log('Setting default strength:', defaultStrength.strength)
              setSelectedStrength(defaultStrength.strength)
            }
          }
          
          if (detailedInfo.quantities && Array.isArray(detailedInfo.quantities)) {
            console.log('Setting available quantities:', detailedInfo.quantities)
            setAvailableQuantities(detailedInfo.quantities.filter(qty => qty.selected === true).length > 0
              ? detailedInfo.quantities.filter(qty => qty.selected === true)
              : detailedInfo.quantities)
            
            // Set default selected quantity
            const defaultQuantity = detailedInfo.quantities.find(qty => qty.selected === true) || detailedInfo.quantities[0]
            if (defaultQuantity) {
              console.log('Setting default quantity:', `${defaultQuantity.quantity} ${defaultQuantity.uom}`)
              setSelectedQuantity(`${defaultQuantity.quantity} ${defaultQuantity.uom}`)
            }
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
          console.error('Error fetching drug info with GSN:', error)
          
          // Try to get basic drug info as a fallback
          try {
            console.log(`Falling back to basic drug info for: ${drugName}`)
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
            
            // Fetch pharmacy prices with the current location and GSN
            await fetchPharmacyPrices(userLocation.latitude, userLocation.longitude, searchRadius)
          }
        }
      } else {
        // No GSN provided, try to get drug info by name
        try {
          console.log(`No GSN provided, searching for drug: ${drugName}`)
          
          // First, search for the drug to get its GSN
          const searchResults = await searchMedications(drugName)
          console.log('Search results:', searchResults)
          
          if (searchResults.length > 0) {
            // Find the best match from search results
            const exactMatch = searchResults.find(
              result => result.drugName.toLowerCase() === drugName.toLowerCase()
            )
            
            const bestMatch = exactMatch || searchResults[0]
            console.log('Best match:', bestMatch)
            
            const gsnFromSearch = bestMatch.gsn
            
            if (gsnFromSearch) {
              console.log(`Found GSN ${gsnFromSearch} for drug ${drugName}, fetching detailed info`)
              
              // Get detailed drug info using the found GSN
              const detailedInfo = await getDetailedDrugInfo(gsnFromSearch)
              console.log('Detailed drug info:', detailedInfo)
              
              // Store the detailed info in state
              setDetailedInfo(detailedInfo)
              
              // Get basic drug info
              const basicInfo = await getDrugInfo(bestMatch.drugName)
              console.log('Basic drug info:', basicInfo)
              
              // Set drug details
              setDrugDetails(basicInfo)
              
              // Extract available forms, strengths, and quantities from the detailed info
              if (detailedInfo.forms && Array.isArray(detailedInfo.forms)) {
                console.log('Setting available forms:', detailedInfo.forms)
                setAvailableForms(detailedInfo.forms.filter(form => form.selected === true).length > 0 
                  ? detailedInfo.forms.filter(form => form.selected === true)
                  : detailedInfo.forms)
                
                // Set default selected form
                const defaultForm = detailedInfo.forms.find(form => form.selected === true) || detailedInfo.forms[0]
                if (defaultForm) {
                  console.log('Setting default form:', defaultForm.form)
                  setSelectedForm(defaultForm.form)
                }
              }
              
              if (detailedInfo.strengths && Array.isArray(detailedInfo.strengths)) {
                console.log('Setting available strengths:', detailedInfo.strengths)
                setAvailableStrengths(detailedInfo.strengths.filter(strength => strength.selected === true).length > 0
                  ? detailedInfo.strengths.filter(strength => strength.selected === true)
                  : detailedInfo.strengths)
                
                // Set default selected strength
                const defaultStrength = detailedInfo.strengths.find(strength => strength.selected === true) || detailedInfo.strengths[0]
                if (defaultStrength) {
                  console.log('Setting default strength:', defaultStrength.strength)
                  setSelectedStrength(defaultStrength.strength)
                }
              }
              
              if (detailedInfo.quantities && Array.isArray(detailedInfo.quantities)) {
                console.log('Setting available quantities:', detailedInfo.quantities)
                setAvailableQuantities(detailedInfo.quantities.filter(qty => qty.selected === true).length > 0
                  ? detailedInfo.quantities.filter(qty => qty.selected === true)
                  : detailedInfo.quantities)
                
                // Set default selected quantity
                const defaultQuantity = detailedInfo.quantities.find(qty => qty.selected === true) || detailedInfo.quantities[0]
                if (defaultQuantity) {
                  console.log('Setting default quantity:', `${defaultQuantity.quantity} ${defaultQuantity.uom}`)
                  setSelectedQuantity(`${defaultQuantity.quantity} ${defaultQuantity.uom}`)
                }
              }
              
              // Set brand options
              if (detailedInfo.brandName && detailedInfo.genericName && detailedInfo.brandName !== detailedInfo.genericName) {
                // If both brand and generic names are available and different, set up brand variations
                const variations = [
                  { name: detailedInfo.brandName, type: 'brand', gsn: gsnFromSearch },
                  { name: detailedInfo.genericName, type: 'generic', gsn: gsnFromSearch }
                ]
                setBrandVariations(variations)
                
                // Set default selected brand based on the current GSN or preference
                setSelectedBrand(detailedInfo.genericName ? 'generic' : 'brand')
              } else if (detailedInfo.brandName || detailedInfo.genericName) {
                // If only one name is available, use it
                const name = detailedInfo.brandName || detailedInfo.genericName
                const variations = [
                  { name, type: 'generic', gsn: gsnFromSearch }
                ]
                setBrandVariations(variations)
                setSelectedBrand('generic')
              }
              
              // Combine the information
              setDrugInfo({
                brandName: detailedInfo.brandName || basicInfo.brandName || drugName,
                genericName: detailedInfo.genericName || basicInfo.genericName || drugName,
                gsn: gsnFromSearch,
                ndcCode: detailedInfo.ndcCode || '',
                description: detailedInfo.description || basicInfo.description || '',
                sideEffects: detailedInfo.sideEffects || basicInfo.sideEffects || '',
                dosage: detailedInfo.dosage || basicInfo.dosage || '',
                storage: detailedInfo.storage || basicInfo.storage || '',
                contraindications: detailedInfo.contraindications || basicInfo.contraindications || ''
              })
              
              // If we found a GSN, update the URL
              if (gsnFromSearch && typeof window !== 'undefined') {
                const url = new URL(window.location.href)
                url.searchParams.set('gsn', gsnFromSearch.toString())
                window.history.replaceState({}, '', url.toString())
              }
              
              // Fetch pharmacy prices with the current location and GSN
              await fetchPharmacyPrices(userLocation.latitude, userLocation.longitude, searchRadius)
            } else {
              // No GSN found, use the drug name for basic info
              console.log(`No GSN found for ${drugName}, using drug name for basic info`)
              
              const basicInfo = await getDrugInfo(bestMatch.drugName || drugName)
              console.log('Basic drug info:', basicInfo)
              
              setDrugInfo({
                brandName: basicInfo.brandName || drugName,
                genericName: basicInfo.genericName || drugName,
                gsn: 0,
                ndcCode: '',
                description: basicInfo.description || '',
                sideEffects: basicInfo.sideEffects || '',
                dosage: basicInfo.dosage || '',
                storage: basicInfo.storage || '',
                contraindications: basicInfo.contraindications || ''
              })
              
              setDrugDetails(basicInfo)
          
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
          
              // Fetch pharmacy prices with the current location and drug name
              await fetchPharmacyPrices(userLocation.latitude, userLocation.longitude, searchRadius)
            }
          } else {
            // No search results found
            console.error(`No search results found for ${drugName}`)
            
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
            setError(`We couldn't find information for ${drugName}. Please try searching for a different medication.`)
            
            // Try to fetch pharmacy prices anyway
            await fetchPharmacyPrices(userLocation.latitude, userLocation.longitude, searchRadius)
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
      console.error('Error in fetchDrugInfo:', error)
      setError('Failed to load drug information. Please try again later.')
    } finally {
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
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.414L11 9.586V6z" clipRule="evenodd" />
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