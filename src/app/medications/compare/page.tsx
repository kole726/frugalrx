'use client';

import React, { useState, useEffect } from 'react';
import { searchMedications } from '@/services/medicationApi';
import { MedicationComparison } from '@/components/medications';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function CompareMedicationsPage() {
  const searchParams = useSearchParams();
  const initialMedication = searchParams.get('initial');
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{ drugName: string; gsn?: number }>>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedMedications, setSelectedMedications] = useState<Array<{ name?: string; gsn?: number }>>([]);
  const [userLocation, setUserLocation] = useState({ latitude: 37.7749, longitude: -122.4194 }); // Default to San Francisco
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const router = useRouter();

  // Get user's location if they allow it
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Keep default location
        }
      );
    }
  }, []);

  // Add initial medication if provided in URL
  useEffect(() => {
    if (initialMedication && selectedMedications.length === 0) {
      setSelectedMedications([{ name: initialMedication }]);
    }
  }, [initialMedication, selectedMedications]);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchMedications(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching medications:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle adding a medication to compare
  const handleAddMedication = (medication: { drugName: string; gsn?: number }) => {
    if (selectedMedications.length >= 3) {
      alert('You can compare up to 3 medications at a time.');
      return;
    }
    
    // Check if medication is already selected
    const isAlreadySelected = selectedMedications.some(med => 
      (med.name && med.name.toLowerCase() === medication.drugName.toLowerCase()) || 
      (med.gsn && medication.gsn && med.gsn === medication.gsn)
    );
    
    if (isAlreadySelected) {
      alert('This medication is already selected for comparison.');
      return;
    }
    
    setSelectedMedications([...selectedMedications, { 
      name: medication.drugName,
      gsn: medication.gsn
    }]);
    
    // Clear search results after adding
    setSearchResults([]);
    setSearchQuery('');
  };

  // Handle removing a medication from comparison
  const handleRemoveMedication = (index: number) => {
    const updatedMedications = [...selectedMedications];
    updatedMedications.splice(index, 1);
    setSelectedMedications(updatedMedications);
  };

  // Start comparison
  const startComparison = () => {
    if (selectedMedications.length < 2) {
      alert('Please select at least 2 medications to compare.');
      return;
    }
    
    setIsComparing(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-800 mb-2">Compare Medications</h1>
      <p className="text-gray-600 mb-8">
        Compare prices and details of multiple medications side by side to make informed decisions.
      </p>
      
      {!isComparing ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Medications to Compare</h2>
            
            {/* Search Box */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-grow">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for a medication..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Search Results</h3>
                <div className="bg-gray-50 rounded-md p-4 max-h-60 overflow-y-auto">
                  <ul className="divide-y divide-gray-200">
                    {searchResults.map((result, index) => (
                      <li key={index} className="py-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-800">{result.drugName}</span>
                          <button
                            onClick={() => handleAddMedication(result)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            Add to Compare
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Selected Medications */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Selected Medications ({selectedMedications.length}/3)
              </h3>
              
              {selectedMedications.length === 0 ? (
                <div className="bg-gray-50 rounded-md p-6 text-center">
                  <p className="text-gray-500">
                    Search for and select medications to compare (up to 3).
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {selectedMedications.map((med, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-blue-50 rounded-lg p-4 relative"
                    >
                      <button
                        onClick={() => handleRemoveMedication(index)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        aria-label="Remove medication"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <h4 className="font-medium text-blue-800">{med.name}</h4>
                      {med.gsn && <p className="text-sm text-blue-600">GSN: {med.gsn}</p>}
                    </motion.div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 flex justify-center">
                <button
                  onClick={startComparison}
                  disabled={selectedMedications.length < 2}
                  className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  Compare Medications
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-6">
            <h3 className="text-lg font-medium text-blue-800 mb-2">How It Works</h3>
            <ol className="list-decimal list-inside text-blue-700 space-y-2">
              <li>Search for medications you want to compare</li>
              <li>Select 2-3 medications from the search results</li>
              <li>Click "Compare Medications" to see a side-by-side comparison</li>
              <li>View pricing information from pharmacies near you</li>
              <li>Make an informed decision about your medication options</li>
            </ol>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setIsComparing(false)}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Selection
          </button>
          
          <MedicationComparison
            medications={selectedMedications}
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            radius={10}
          />
        </div>
      )}
    </div>
  );
} 