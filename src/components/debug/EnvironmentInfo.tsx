'use client';

import { useState } from 'react';
import { USE_MOCK_DATA, FEATURES, useMockDataFor } from '@/config/environment';

/**
 * Debug component that displays the current environment configuration
 * Only visible when FEATURES.showDebugInfo is true
 */
export default function EnvironmentInfo() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Only show in development or when debug is enabled
  if (!FEATURES.showDebugInfo) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-2 rounded-lg text-xs shadow-lg max-w-xs">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">Environment Info</h3>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
        >
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-2 space-y-2">
          <div>
            <div className="font-semibold">Environment:</div>
            <div>{process.env.NODE_ENV}</div>
          </div>
          
          <div>
            <div className="font-semibold">Mock Data:</div>
            <div className={USE_MOCK_DATA ? 'text-green-400' : 'text-red-400'}>
              {USE_MOCK_DATA ? 'Enabled' : 'Disabled'}
            </div>
          </div>
          
          <div>
            <div className="font-semibold">Feature-specific Mock Data:</div>
            <ul className="pl-4 list-disc">
              <li>
                Drug Search: {useMockDataFor('DRUG_SEARCH') ? 'Mock' : 'Real API'}
              </li>
              <li>
                Drug Info: {useMockDataFor('DRUG_INFO') ? 'Mock' : 'Real API'}
              </li>
              <li>
                Pharmacy Prices: {useMockDataFor('PHARMACY_PRICES') ? 'Mock' : 'Real API'}
              </li>
            </ul>
          </div>
          
          <div>
            <div className="font-semibold">Feature Flags:</div>
            <ul className="pl-4 list-disc">
              {Object.entries(FEATURES).map(([key, value]) => (
                <li key={key}>
                  {key}: {value.toString()}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="text-gray-400 text-[10px] mt-2">
            This debug panel is only visible in development mode or when NEXT_PUBLIC_SHOW_DEBUG=true
          </div>
        </div>
      )}
    </div>
  );
} 