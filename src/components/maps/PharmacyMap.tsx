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
      
      // Create new markers
      const newMarkers = pharmacies.map((pharmacy, index) => {
        // Use pharmacy coordinates if available, otherwise calculate from address
        const position = { 
          lat: pharmacy.latitude || 0, 
          lng: pharmacy.longitude || 0 
        };
        
        // Skip if we don't have valid coordinates
        if (!position.lat || !position.lng) {
          console.log("Skipping pharmacy with invalid coordinates:", pharmacy.name);
          return null;
        }
        
        console.log(`Creating marker for ${pharmacy.name} at ${position.lat}, ${position.lng}`);
        
        // Add position to bounds
        bounds.extend(position);
        
        // Check if this marker is selected
        const isSelected = selectedMarker === pharmacy.pharmacyId;
        
        // Create marker with custom icon
        const marker = new window.google.maps.Marker({
          position,
          map: map,
          title: pharmacy.name,
          icon: createPharmacyMarker(index, isSelected),
          label: {
            text: (index + 1).toString(),
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px'
          },
          animation: window.google.maps.Animation.DROP,
          zIndex: isSelected ? 999 : 1 // Bring selected marker to front
        });
        
        // Create info window with pharmacy details
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-3">
              <h3 class="font-semibold text-[#006142] text-lg">${pharmacy.name}</h3>
              <p class="text-gray-700">${pharmacy.address}, ${pharmacy.city}, ${pharmacy.state} ${pharmacy.postalCode}</p>
              <p class="text-sm text-gray-600 mt-1">${pharmacy.distance.toFixed(1)} miles away</p>
              ${pharmacy.phone ? `<p class="text-sm text-[#006142] mt-1"><a href="tel:${pharmacy.phone}">${formatPhoneNumber(pharmacy.phone)}</a></p>` : ''}
              <div class="mt-2 flex flex-wrap gap-1">
                ${pharmacy.open24H ? '<span class="text-xs bg-[#EFFDF6] text-[#006142] px-2 py-1 rounded">Open 24 Hours</span>' : ''}
                ${pharmacy.driveUpWindow ? '<span class="text-xs bg-[#EFFDF6] text-[#006142] px-2 py-1 rounded">Drive-Up Window</span>' : ''}
                ${pharmacy.handicapAccess ? '<span class="text-xs bg-[#EFFDF6] text-[#006142] px-2 py-1 rounded">Handicap Access</span>' : ''}
              </div>
              ${pharmacy.price ? `<p class="text-xl font-bold text-[#006142] mt-2">$${pharmacy.price.toFixed(2)}</p>` : ''}
              <button class="mt-3 bg-[#006142] text-white px-4 py-2 rounded-md hover:bg-[#22A307] transition-colors w-full text-center font-medium" id="get-coupon-btn-${pharmacy.pharmacyId}">Get Free Coupon</button>
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
          markers[index].setIcon(createPharmacyMarker(index, true));
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
          markers[index].setIcon(createPharmacyMarker(index, false));
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

  // Update local ZIP code when prop changes
  useEffect(() => {
    if (zipCode !== localZipCode) {
      console.log(`ZIP code prop changed from ${localZipCode} to ${zipCode}`);
      setLocalZipCode(zipCode);
    }
  }, [zipCode, localZipCode]);

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
      <div className="relative flex-grow">
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