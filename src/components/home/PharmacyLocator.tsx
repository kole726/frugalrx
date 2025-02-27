"use client"
import { useState, useEffect } from "react"
import { MapPinIcon } from "@heroicons/react/24/outline"
import { getPharmaciesByZipCode } from "@/services/medicationApi"
import PharmacyMap from "@/components/maps/PharmacyMap"
import { forceTokenRefresh } from "@/utils/mapsTokenManager"

interface Pharmacy {
  pharmacyId: number;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  distance: number;
  latitude?: number;
  longitude?: number;
  open24H?: boolean;
  driveUpWindow?: boolean;
  handicapAccess?: boolean;
}

export default function PharmacyLocator() {
  const [zipCode, setZipCode] = useState("")
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null)
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number} | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Get coordinates for the ZIP code from our API's mapping
  useEffect(() => {
    if (pharmacies.length > 0) {
      try {
        // Try to get coordinates from the first pharmacy
        const firstPharmacy = pharmacies[0];
        if (firstPharmacy.latitude && firstPharmacy.longitude) {
          setMapCenter({
            lat: firstPharmacy.latitude,
            lng: firstPharmacy.longitude
          });
        }
        
        // Set showMap to true once we have pharmacies
        setShowMap(true);
        setMapError(null);
      } catch (error) {
        console.error("Error setting map center:", error);
        // Don't block rendering if there's an error
        setMapError("Unable to display the map. Please try again later.");
        setShowMap(false);
      }
    }
  }, [pharmacies]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!zipCode || zipCode.length < 5) {
      setError("Please enter a valid ZIP code")
      return
    }
    
    setLoading(true)
    setError(null)
    setMapError(null)
    setSelectedPharmacy(null)
    
    try {
      // Force refresh the maps token before searching
      await forceTokenRefresh();
      
      const data = await getPharmaciesByZipCode(zipCode)
      
      // Add latitude and longitude to each pharmacy based on the API response
      // The API might already include these, but we're adding them here just in case
      const enhancedData = data.map((pharmacy: Pharmacy) => {
        // If the API doesn't provide lat/lng, we could geocode the address here
        // For now, we'll use dummy coordinates if they're not provided
        if (!pharmacy.latitude && !pharmacy.longitude) {
          // These would ideally come from geocoding the address
          // For now, we'll use the coordinates from our ZIP code mapping
          const zipCoordinates = getZipCodeCoordinates(zipCode);
          if (zipCoordinates) {
            return {
              ...pharmacy,
              latitude: zipCoordinates.latitude + (Math.random() * 0.01 - 0.005), // Add small random offset
              longitude: zipCoordinates.longitude + (Math.random() * 0.01 - 0.005)
            };
          }
        }
        return pharmacy;
      });
      
      setPharmacies(enhancedData);
      
      if (data.length === 0) {
        setError("No pharmacies found in this area")
        setShowMap(false)
      }
    } catch (err) {
      console.error("Error fetching pharmacies:", err)
      setError("Failed to fetch pharmacies. Please try again.")
      setShowMap(false)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkerClick = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    // Scroll to the pharmacy in the list
    const element = document.getElementById(`pharmacy-${pharmacy.pharmacyId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-green-50');
      setTimeout(() => {
        element.classList.remove('bg-green-50');
      }, 1500);
    }
  };

  // Handle map errors
  const handleMapError = (errorMessage: string) => {
    setMapError(errorMessage);
    // Keep showing the map container, but with an error message
    setShowMap(true);
  };

  return (
    <div className="mt-16 bg-white rounded-2xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="p-8 text-center">
        <h3 className="text-2xl font-bold text-[#2C3E50] mb-4">
          Find Participating Pharmacies Near You
        </h3>
        <p className="text-gray-500 mb-6">
          Enter your location to find the closest pharmacies that accept FrugalRx
        </p>
        
        <form onSubmit={handleSearch} className="flex max-w-md mx-auto">
          <div className="relative flex-1">
            <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter ZIP code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button 
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-r-lg font-semibold transition-colors"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
        
        {error && (
          <div className="mt-4 text-red-500">{error}</div>
        )}
      </div>

      {/* Map and Pharmacy Results */}
      {pharmacies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Map */}
          <div className="h-[400px] md:h-auto">
            {showMap && mapCenter && (
              <>
                {mapError ? (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <div className="text-center p-6">
                      <p className="text-red-500 mb-2">{mapError}</p>
                      <button 
                        onClick={() => {
                          setMapError(null);
                          forceTokenRefresh().then(() => {
                            // Re-trigger the map rendering
                            setShowMap(false);
                            setTimeout(() => setShowMap(true), 100);
                          });
                        }}
                        className="text-primary hover:underline"
                      >
                        Retry Loading Map
                      </button>
                    </div>
                  </div>
                ) : (
                  <PharmacyMap 
                    pharmacies={pharmacies}
                    zipCode={zipCode}
                    centerLat={mapCenter.lat}
                    centerLng={mapCenter.lng}
                    onMarkerClick={handleMarkerClick}
                  />
                )}
              </>
            )}
          </div>
          
          {/* Pharmacy List */}
          <div className="px-8 pb-8 max-h-[500px] overflow-y-auto">
            <h4 className="text-lg font-semibold mb-4 sticky top-0 bg-white py-2">
              Pharmacies near {zipCode}
            </h4>
            <div className="space-y-4">
              {pharmacies.map((pharmacy, index) => (
                <div 
                  id={`pharmacy-${pharmacy.pharmacyId}`}
                  key={pharmacy.pharmacyId} 
                  className={`border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${selectedPharmacy?.pharmacyId === pharmacy.pharmacyId ? 'ring-2 ring-primary bg-green-50/30' : ''}`}
                  onClick={() => setSelectedPharmacy(pharmacy)}
                >
                  <div className="flex items-start">
                    <div className={`text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 ${selectedPharmacy?.pharmacyId === pharmacy.pharmacyId ? 'bg-primary scale-110' : 'bg-primary'}`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-primary">{pharmacy.name}</h5>
                      <p className="text-gray-600">{pharmacy.address}, {pharmacy.city}, {pharmacy.state} {pharmacy.postalCode}</p>
                      <div className="flex justify-between mt-2">
                        <span className="text-sm text-gray-500">
                          {pharmacy.distance ? `${pharmacy.distance.toFixed(1)} miles away` : ""}
                        </span>
                        <a href={`tel:${pharmacy.phone}`} className="text-sm text-primary hover:underline">
                          {formatPhoneNumber(pharmacy.phone)}
                        </a>
                      </div>
                      {(pharmacy.open24H || pharmacy.driveUpWindow || pharmacy.handicapAccess) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {pharmacy.open24H && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Open 24 Hours</span>
                          )}
                          {pharmacy.driveUpWindow && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Drive-Up Window</span>
                          )}
                          {pharmacy.handicapAccess && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Handicap Access</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Map Preview - Shown when no pharmacies are loaded yet */
        <div className="relative h-64 bg-[#F8FAFC]">
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            {loading ? "Searching for pharmacies..." : "Enter a ZIP code to find pharmacies near you"}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to format phone numbers as (XXX) XXX-XXXX
function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || phoneNumber.length !== 10) return phoneNumber;
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
}

// Helper function to get coordinates for a ZIP code
function getZipCodeCoordinates(zipCode: string): { latitude: number; longitude: number } | null {
  try {
    // Map of zip codes to coordinates (same as in the API)
    const zipCodeCoordinates: Record<string, { latitude: number; longitude: number }> = {
      '78759': { latitude: 30.4014, longitude: -97.7525 }, // Austin, TX
      '90210': { latitude: 34.0901, longitude: -118.4065 }, // Beverly Hills, CA
      '10001': { latitude: 40.7501, longitude: -73.9996 }, // New York, NY
      '60601': { latitude: 41.8855, longitude: -87.6217 }, // Chicago, IL
      '33101': { latitude: 25.7751, longitude: -80.2105 }, // Miami, FL
      '98101': { latitude: 47.6101, longitude: -122.3344 }, // Seattle, WA
      '02108': { latitude: 42.3588, longitude: -71.0707 }, // Boston, MA
      '75201': { latitude: 32.7864, longitude: -96.7970 }, // Dallas, TX
      '94102': { latitude: 37.7790, longitude: -122.4194 }, // San Francisco, CA
    };
    
    return zipCodeCoordinates[zipCode] || null;
  } catch (error) {
    console.error("Error getting ZIP code coordinates:", error);
    return null;
  }
} 