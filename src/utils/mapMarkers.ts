/**
 * Map marker utilities for creating custom markers
 */

// SVG path for a pharmacy pin marker
export const PHARMACY_PIN_PATH = 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z';

// Colors for markers
export const MARKER_COLORS = {
  primary: '#006142', // Primary green
  secondary: '#22A307', // Secondary green
  accent: '#EF065B', // Accent pink
  selected: '#006142', // Selected marker color
  default: '#64748B', // Default gray
};

/**
 * Create a custom pin marker icon
 * @param color The fill color for the marker
 * @param selected Whether this marker is selected
 * @returns A Google Maps marker icon configuration
 */
export function createPinMarker(color: string = MARKER_COLORS.primary, selected: boolean = false) {
  return {
    path: PHARMACY_PIN_PATH,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    scale: selected ? 2.2 : 2,
    anchor: new window.google.maps.Point(12, 22),
    labelOrigin: new window.google.maps.Point(12, 10),
  };
}

/**
 * Create a numbered marker for pharmacies
 * @param index The index number to display on the marker
 * @param selected Whether this marker is selected
 * @returns A Google Maps marker icon configuration
 */
export function createPharmacyMarker(index: number, selected: boolean = false) {
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
}

/**
 * Create a custom marker for the user's location
 * @returns A Google Maps marker icon configuration
 */
export function createUserLocationMarker() {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: '#4285F4',
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    scale: 8,
  };
} 