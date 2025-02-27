"use client"
import { useEffect, useRef, useState } from 'react'
import { getGoogleMapsWithRefresh } from '@/utils/mapsTokenManager'
import { MARKER_COLORS, PHARMACY_PIN_PATH } from '@/utils/mapMarkers'

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

interface PharmacyMapProps {
  pharmacies: Pharmacy[];
  zipCode: string;
  centerLat?: number;
  centerLng?: number;
  onMarkerClick?: (pharmacy: Pharmacy) => void;
}

// Define a type for the Google Maps API
declare global {
  interface Window {
    google: {
      maps: Record<string, any>;
    };
  }
}

// Google Maps type definitions
interface GoogleMapOptions {
  center: GoogleLatLng;
  zoom: number;
  mapTypeId?: string;
  [key: string]: any;
}

interface GoogleLatLng {
  lat(): number;
  lng(): number;
  [key: string]: any;
}

interface GoogleMarkerOptions {
  position: GoogleLatLng;
  map: GoogleMap | null;
  icon?: string;
  title?: string;
  [key: string]: any;
}

interface GoogleMarker {
  setMap: (map: GoogleMap | null) => void;
  addListener: (event: string, callback: () => void) => void;
  [key: string]: any;
}

interface GoogleMap {
  setCenter: (latLng: GoogleLatLng) => void;
  setZoom: (zoom: number) => void;
  [key: string]: any;
}

interface GoogleInfoWindowOptions {
  content: string;
  [key: string]: any;
}

interface GoogleInfoWindow {
  open: (map: GoogleMap, marker: GoogleMarker) => void;
  close: () => void;
  [key: string]: any;
}

export default function PharmacyMap({ 
  pharmacies, 
  zipCode, 
  centerLat, 
  centerLng,
  onMarkerClick 
}: PharmacyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Record<string, any> | null>(null);
  const [markers, setMarkers] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const maxRetries = 3;

  // Create a pharmacy marker icon
  const createPharmacyMarker = (index: number, selected: boolean = false) => {
    if (!window.google) return null;
    
    return {
      path: PHARMACY_PIN_PATH,
      fillColor: selected ? MARKER_COLORS.selected : MARKER_COLORS.primary,
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: selected ? 2.2 : 2,
      anchor: new window.google.maps.Point(12, 22),
      labelOrigin: new window.google.maps.Point(12, 10),
    };
  };

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
        
        // Implement retry logic
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          // Wait a bit before retrying
          setTimeout(() => {
            initMap();
          }, 2000);
        } else {
          setError('Failed to load the map after multiple attempts. Please try again later.');
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
      } catch (err) {
        console.error('Error cleaning up map:', err);
      }
    };
  }, [centerLat, centerLng, retryCount]);

  // Add markers for pharmacies
  useEffect(() => {
    if (!map || !pharmacies.length || !window.google) {
      console.log("Map, pharmacies, or Google Maps API not available yet");
      return;
    }

    console.log("Adding markers for", pharmacies.length, "pharmacies");

    try {
      // Clear existing markers
      markers.forEach(marker => {
        if (marker) marker.setMap(null);
      });
      
      // Create bounds to fit all markers
      const bounds = new window.google.maps.LatLngBounds();
      
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
        
        // Create custom icon
        const icon = {
          path: PHARMACY_PIN_PATH,
          fillColor: isSelected ? MARKER_COLORS.selected : MARKER_COLORS.primary,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: isSelected ? 2.2 : 2,
          anchor: new window.google.maps.Point(12, 22),
          labelOrigin: new window.google.maps.Point(12, 10),
        };
        
        // Create marker with custom icon
        const marker = new window.google.maps.Marker({
          position,
          map,
          title: pharmacy.name,
          icon: icon,
          label: {
            text: (index + 1).toString(),
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px'
          },
          animation: window.google.maps.Animation.DROP,
          zIndex: isSelected ? 1000 : 1 // Bring selected marker to front
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
                ${pharmacy.open24H ? '<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Open 24 Hours</span>' : ''}
                ${pharmacy.driveUpWindow ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Drive-Up Window</span>' : ''}
                ${pharmacy.handicapAccess ? '<span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Handicap Access</span>' : ''}
              </div>
            </div>
          `
        });
        
        // Add click listener
        marker.addListener('click', () => {
          // Close all other info windows
          markers.forEach(m => {
            if (m && m !== marker) {
              window.google.maps.event.clearListeners(m, 'closeclick');
            }
          });
          
          // Open this info window
          infoWindow.open(map, marker);
          
          // Update selected marker
          setSelectedMarker(pharmacy.pharmacyId);
          
          // Call the onMarkerClick callback if provided
          if (onMarkerClick) {
            onMarkerClick(pharmacy);
          }
        });
        
        return marker;
      }).filter(Boolean) as Record<string, any>[];
      
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
  }, [map, pharmacies, onMarkerClick, selectedMarker]);

  // Update marker when a pharmacy is selected from the list
  useEffect(() => {
    if (!map || !markers.length || !window.google) return;
    
    // Find the selected pharmacy and update its marker
    pharmacies.forEach((pharmacy, index) => {
      if (pharmacy.pharmacyId === selectedMarker) {
        // Update the marker icon to show it's selected
        if (markers[index]) {
          const icon = {
            path: PHARMACY_PIN_PATH,
            fillColor: MARKER_COLORS.selected,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 2.2,
            anchor: new window.google.maps.Point(12, 22),
            labelOrigin: new window.google.maps.Point(12, 10),
          };
          
          markers[index].setIcon(icon);
          markers[index].setZIndex(1000); // Bring to front
        }
      } else {
        // Reset other markers
        if (markers[index]) {
          const icon = {
            path: PHARMACY_PIN_PATH,
            fillColor: MARKER_COLORS.primary,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 2,
            anchor: new window.google.maps.Point(12, 22),
            labelOrigin: new window.google.maps.Point(12, 10),
          };
          
          markers[index].setIcon(icon);
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

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-red-500 text-center p-4">
            <p>{error}</p>
            <button 
              className="mt-2 text-primary hover:underline"
              onClick={handleRetry}
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="w-full h-full min-h-[400px]"
        aria-label={`Map showing pharmacies near ${zipCode}`}
      />
    </div>
  );
}

// Helper function to format phone numbers as (XXX) XXX-XXXX
function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || phoneNumber.length !== 10) return phoneNumber;
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
} 