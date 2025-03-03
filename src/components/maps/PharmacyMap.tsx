"use client"
import { useEffect, useRef, useState } from 'react'
import { getGoogleMapsWithRefresh } from '@/utils/mapsTokenManager'
import { MARKER_COLORS, createPharmacyMarker, createUserLocationMarker } from '@/utils/mapMarkers'

interface Pharmacy {
  pharmacyId: number;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone?: string;
  distance: number;
  latitude?: number;
  longitude?: number;
  open24H?: boolean;
  driveUpWindow?: boolean;
  handicapAccess?: boolean;
  price?: number;
}

interface PharmacyMapProps {
  pharmacies: Pharmacy[];
  zipCode: string;
  centerLat?: number;
  centerLng?: number;
  onMarkerClick?: (pharmacy: Pharmacy) => void;
  onZipCodeChange?: (zipCode: string) => void;
  onRadiusChange?: (radius: number) => void;
  searchRadius?: number;
}

// Define a type for the Google Maps API
declare global {
  interface Window {
    google: {
      maps: any;
    };
  }
}

// Google Maps type definitions
type GoogleMap = google.maps.Map;
type GoogleMarker = google.maps.Marker;
type GoogleInfoWindow = google.maps.InfoWindow;
type GoogleLatLng = google.maps.LatLng;

export default function PharmacyMap({ 
  pharmacies, 
  zipCode, 
  centerLat, 
  centerLng,
  onMarkerClick,
  onZipCodeChange,
  onRadiusChange,
  searchRadius = 50
}: PharmacyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<GoogleMap | null>(null);
  const [markers, setMarkers] = useState<GoogleMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [activeInfoWindow, setActiveInfoWindow] = useState<GoogleInfoWindow | null>(null);
  const [localZipCode, setLocalZipCode] = useState(zipCode);
  const [localRadius, setLocalRadius] = useState(searchRadius);
  const [userLocationMarker, setUserLocationMarker] = useState<GoogleMarker | null>(null);
  const maxRetries = 3;

  // Initialize the map
  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    const initMap = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use our token manager to get the Google Maps API with automatic refreshing
        const googleMaps = await getGoogleMapsWithRefresh();
        
        // Default center (will be overridden if we have pharmacies)
        const center = { 
          lat: centerLat || 37.7749, 
          lng: centerLng || -122.4194 
        };

        // Create the map
        const mapInstance = new googleMaps.maps.Map(mapElement, {
          center,
          zoom: 12,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        setMap(mapInstance);
        setLoading(false);
        // Reset retry count on success
        setRetryCount(0);
      } catch (err) {
        console.error('Error initializing map:', err);
        
        // Display a more helpful error message based on the error type
        const errorMessage = err instanceof Error ? err.message : String(err);
        
        if (errorMessage.includes('API key')) {
          setError('Google Maps API key is invalid or missing. Please check your environment configuration.');
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          setError('Network error. Please check your internet connection and try again.');
        } else {
          setError(`Failed to load the map: ${errorMessage}`);
        }
        
        // Implement retry logic
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          // Wait a bit before retrying
          setTimeout(() => {
            initMap();
          }, 2000);
        } else {
          setLoading(false);
        }
      }
    };

    initMap();

    // Cleanup function
    return () => {
      try {
        // Clear markers when component unmounts
        markers.forEach(marker => {
          if (marker) marker.setMap(null);
        });
        setMarkers([]);
        
        // Clear user location marker
        if (userLocationMarker) {
          userLocationMarker.setMap(null);
          setUserLocationMarker(null);
        }
      } catch (err) {
        console.error('Error cleaning up map:', err);
      }
    };
  }, [centerLat, centerLng, retryCount]);

  // Add user location marker
  useEffect(() => {
    if (!map || !window.google || !centerLat || !centerLng) return;
    
    try {
      // Clear existing user location marker
      if (userLocationMarker) {
        userLocationMarker.setMap(null);
      }
      
      // Create a new user location marker
      const position = new window.google.maps.LatLng(centerLat, centerLng);
      const marker = new window.google.maps.Marker({
        position,
        map: map,
        icon: createUserLocationMarker(),
        title: 'Your Location',
        zIndex: 1000 // Keep user location marker on top
      });
      
      setUserLocationMarker(marker);
    } catch (err) {
      console.error('Error adding user location marker:', err);
    }
  }, [map, centerLat, centerLng]);

  // Add markers for pharmacies
  useEffect(() => {
    if (!map || !pharmacies.length || !window.google) {
      console.log("Map, pharmacies, or Google Maps API not available yet");
      return;
    }

    console.log("Adding markers for", pharmacies.length, "pharmacies");

    try {
      // Close any active info window
      if (activeInfoWindow) {
        activeInfoWindow.close();
        setActiveInfoWindow(null);
      }

      // Clear existing markers
      markers.forEach(marker => {
        if (marker) marker.setMap(null);
      });
      
      // Create bounds to fit all markers
      const bounds = new window.google.maps.LatLngBounds();
      
      // Add user location to bounds if available
      if (centerLat && centerLng) {
        bounds.extend({ lat: centerLat, lng: centerLng });
      }
      
      // Determine which pharmacy has the best price and which is closest
      let bestPriceIndex = -1;
      let closestIndex = -1;
      
      if (pharmacies.length > 0) {
        // Find the pharmacy with the lowest price
        let lowestPrice = Number.MAX_VALUE;
        pharmacies.forEach((pharmacy, idx) => {
          if (pharmacy.price && pharmacy.price < lowestPrice) {
            lowestPrice = pharmacy.price;
            bestPriceIndex = idx;
          }
        });
        
        // Find the closest pharmacy
        let shortestDistance = Number.MAX_VALUE;
        pharmacies.forEach((pharmacy, idx) => {
          if (pharmacy.distance < shortestDistance) {
            shortestDistance = pharmacy.distance;
            closestIndex = idx;
          }
        });
      }
      
      // Create markers for each pharmacy
      const newMarkers = pharmacies.map((pharmacy, index) => {
        try {
          // Check if this marker is selected
          const isSelected = pharmacy.pharmacyId === selectedMarker;
          const isBestPrice = index === bestPriceIndex;
          const isClosest = index === closestIndex;
          
          // Create bounds to fit all markers
          if (pharmacy.latitude && pharmacy.longitude) {
            bounds.extend({
              lat: pharmacy.latitude,
              lng: pharmacy.longitude
            });
          }
          
          // Create the marker
          const marker = new window.google.maps.Marker({
            position: {
              lat: pharmacy.latitude || 0,
              lng: pharmacy.longitude || 0
            },
            map,
            title: pharmacy.name,
            icon: createPharmacyMarker(pharmacy.pharmacyId, isSelected, isBestPrice, isClosest),
            label: {
              text: (pharmacy.pharmacyId + 1).toString(),
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            },
            animation: window.google.maps.Animation.DROP,
            zIndex: isSelected ? 999 : (isBestPrice || isClosest ? 100 : 1) // Bring important markers to front
          });
          
          // Create info window with pharmacy details
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="p-4 max-w-[300px]">
                <div class="flex items-start justify-between">
                  <h3 class="font-semibold text-emerald-700 text-lg">${pharmacy.name}</h3>
                  ${pharmacy.price ? `
                    <div class="bg-emerald-50 px-3 py-1 rounded-lg">
                      <p class="text-xl font-bold text-emerald-600">$${pharmacy.price.toFixed(2)}</p>
                    </div>
                  ` : ''}
                </div>
                
                <div class="mt-2 flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>${pharmacy.distance.toFixed(1)} miles away</span>
                </div>
                
                <div class="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <p class="text-gray-700">${pharmacy.address}, ${pharmacy.city}, ${pharmacy.state} ${pharmacy.postalCode}</p>
                  ${pharmacy.phone ? `
                    <p class="text-sm text-emerald-600 mt-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href="tel:${pharmacy.phone}" class="hover:underline">${formatPhoneNumber(pharmacy.phone)}</a>
                    </p>
                  ` : ''}
                </div>
                
                <div class="mt-3 flex flex-wrap gap-1">
                  ${pharmacy.open24H ? `
                    <span class="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Open 24 Hours
                    </span>
                  ` : ''}
                  ${pharmacy.driveUpWindow ? `
                    <span class="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Drive-Up Window
                    </span>
                  ` : ''}
                  ${pharmacy.handicapAccess ? `
                    <span class="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      Handicap Access
                    </span>
                  ` : ''}
                </div>
                
                <button class="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors w-full text-center font-medium shadow-sm" id="get-coupon-btn-${pharmacy.pharmacyId}">
                  Get Free Coupon
                </button>
              </div>
            `
          });
          
          // Add click listener
          marker.addListener('click', () => {
            // Close any active info window
            if (activeInfoWindow) {
              activeInfoWindow.close();
            }
            
            // Open this info window
            infoWindow.open(map, marker);
            setActiveInfoWindow(infoWindow);
            
            // Update selected marker
            setSelectedMarker(pharmacy.pharmacyId);
            
            // Add event listener for the "Get Free Coupon" button
            window.google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
              const button = document.getElementById(`get-coupon-btn-${pharmacy.pharmacyId}`);
              if (button) {
                button.addEventListener('click', () => {
                  if (onMarkerClick) {
                    onMarkerClick(pharmacy);
                  }
                });
              }
            });
          });
          
          return marker;
        } catch (err) {
          console.error('Error creating marker:', err);
          return null;
        }
      }).filter(Boolean) as GoogleMarker[];
      
      console.log("Created", newMarkers.length, "markers");
      setMarkers(newMarkers);
      
      // Fit map to bounds if we have markers
      if (newMarkers.length > 0) {
        map.fitBounds(bounds);
        
        // Don't zoom in too far
        const listener = window.google.maps.event.addListener(map, 'idle', () => {
          const zoom = map.getZoom();
          if (zoom && zoom > 16) map.setZoom(16);
          window.google.maps.event.removeListener(listener);
        });
      }
    } catch (err) {
      console.error('Error adding markers to map:', err);
      // Don't block rendering if there's an error with markers
    }
  }, [map, pharmacies, onMarkerClick, selectedMarker, centerLat, centerLng]);

  // Update marker when a pharmacy is selected from the list
  useEffect(() => {
    if (!map || !markers.length || !window.google) return;
    
    // Find the selected pharmacy and update its marker
    pharmacies.forEach((pharmacy, index) => {
      if (pharmacy.pharmacyId === selectedMarker) {
        // Update the marker icon to show it's selected
        if (markers[index]) {
          markers[index].setIcon(createPharmacyMarker(pharmacy.pharmacyId, true));
          markers[index].setZIndex(999); // Bring to front
          
          // Center the map on this marker
          const position = markers[index].getPosition();
          if (position) {
            map.setCenter(position);
            map.setZoom(14);
          }
        }
      } else {
        // Reset other markers
        if (markers[index]) {
          markers[index].setIcon(createPharmacyMarker(pharmacy.pharmacyId, false));
          markers[index].setZIndex(1);
        }
      }
    });
  }, [selectedMarker, markers, map, pharmacies]);

  // Handle map retry
  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    setLoading(true);
  };

  // Update local ZIP code when prop changes
  useEffect(() => {
    if (zipCode !== localZipCode) {
      console.log(`ZIP code prop changed from ${localZipCode} to ${zipCode}`);
      setLocalZipCode(zipCode);
    }
  }, [zipCode]);

  // Handle ZIP code change
  const handleZipCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate ZIP code format (5 digits)
    if (!localZipCode || !/^\d{5}$/.test(localZipCode)) {
      setError("Please enter a valid 5-digit ZIP code");
      return;
    }
    
    if (onZipCodeChange && localZipCode) {
      console.log(`Submitting ZIP code update: ${localZipCode}`);
      setLoading(true); // Show loading state while updating
      setError(null); // Clear any previous errors
      onZipCodeChange(localZipCode);
    }
  };

  // Handle radius change
  const handleRadiusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const radius = parseInt(e.target.value, 10);
    setLocalRadius(radius);
    if (onRadiusChange) {
      console.log(`Updating search radius to: ${radius} miles`);
      onRadiusChange(radius);
    }
  };

  // Update local radius when prop changes
  useEffect(() => {
    if (searchRadius !== localRadius) {
      console.log(`Search radius prop changed from ${localRadius} to ${searchRadius}`);
      setLocalRadius(searchRadius);
    }
  }, [searchRadius, localRadius]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Map Controls */}
      <div className="bg-white p-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
        <form onSubmit={handleZipCodeSubmit} className="flex items-center">
          <label htmlFor="zipCode" className="sr-only">ZIP Code</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              id="zipCode"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#006142] focus:border-[#006142] block w-full pl-10 p-2.5"
              placeholder="ZIP Code"
              value={localZipCode}
              onChange={(e) => setLocalZipCode(e.target.value)}
              pattern="[0-9]{5}"
              maxLength={5}
            />
          </div>
          <button
            type="submit"
            className="ml-2 text-white bg-[#006142] hover:bg-[#22A307] focus:ring-4 focus:outline-none focus:ring-[#EFFDF6] font-medium rounded-lg text-sm px-4 py-2.5"
          >
            Update
          </button>
        </form>
        
        <div className="flex items-center">
          <label htmlFor="radius" className="mr-2 text-sm font-medium text-gray-700">Radius:</label>
          <select
            id="radius"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#006142] focus:border-[#006142] block p-2.5"
            value={localRadius}
            onChange={handleRadiusChange}
          >
            <option value={5}>5 miles</option>
            <option value={10}>10 miles</option>
            <option value={25}>25 miles</option>
            <option value={50}>50 miles</option>
          </select>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="relative flex-grow h-full">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006142]"></div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-red-500 text-center p-4 max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="mb-4">{error}</p>
              <button 
                className="px-4 py-2 bg-[#006142] text-white rounded-md hover:bg-[#22A307] transition-colors"
                onClick={handleRetry}
              >
                Retry
              </button>
              {error.includes('API key') && (
                <p className="mt-4 text-sm text-gray-600">
                  Note: You need to set a valid Google Maps API key in your .env.local file.
                </p>
              )}
            </div>
          </div>
        )}
        
        <div 
          ref={mapRef} 
          className="w-full h-full min-h-[400px]"
          aria-label={`Map showing pharmacies near ${zipCode}`}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />
      </div>
    </div>
  );
}

// Helper function to format phone numbers as (XXX) XXX-XXXX
function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || phoneNumber.length !== 10) return phoneNumber;
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
} 