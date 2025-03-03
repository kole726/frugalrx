/**
 * Map marker utilities for creating custom markers
 */

// SVG path for a pharmacy pin marker
export const PHARMACY_PIN_PATH = 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z';

// Colors for markers
export const MARKER_COLORS = {
  primary: '#10b981', // Primary emerald
  secondary: '#059669', // Secondary emerald
  accent: '#f59e0b', // Amber accent for best price
  selected: '#0ea5e9', // Blue for selected
  default: '#64748b', // Default slate
  bestPrice: '#f59e0b', // Amber for best price
  closest: '#0ea5e9', // Blue for closest
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
export function createPharmacyMarker(index: number, selected: boolean = false, isBestPrice: boolean = false, isClosest: boolean = false) {
  // Determine the color based on status
  let fillColor = MARKER_COLORS.primary;
  if (selected) {
    fillColor = MARKER_COLORS.selected;
  } else if (isBestPrice) {
    fillColor = MARKER_COLORS.bestPrice;
  } else if (isClosest) {
    fillColor = MARKER_COLORS.closest;
  }
  
  return {
    path: PHARMACY_PIN_PATH,
    fillColor: fillColor,
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    scale: selected ? 2.2 : (isBestPrice || isClosest ? 2.1 : 2),
    anchor: new window.google.maps.Point(12, 22),
    labelOrigin: new window.google.maps.Point(12, 10),
  };
}

/**
 * Create a custom marker for the user's location
 * @returns A Google Maps marker icon configuration
 */
export function createUserLocationMarker() {
  // Create a more visually appealing user location marker
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: '#3b82f6', // Blue
    fillOpacity: 0.8,
    strokeColor: '#FFFFFF',
    strokeWeight: 3,
    scale: 10,
    // Add a pulse effect with a second circle
    animation: window.google.maps.Animation.BOUNCE,
  };
} 