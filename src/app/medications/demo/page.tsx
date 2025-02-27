'use client';

import React, { useState } from 'react';
import { MedicationComparison, MedicationAlternatives } from '@/components/medications';
import { DrugInfo } from '@/types/api';

// Sample data for demonstration purposes
const sampleMedications: DrugInfo[] = [
  {
    brandName: 'Lipitor',
    genericName: 'atorvastatin',
    description: 'Used to lower cholesterol and reduce the risk of heart disease.',
    dosage: '10mg, 20mg, 40mg, 80mg tablets',
    sideEffects: 'Muscle pain, diarrhea, upset stomach, memory problems, confusion',
    contraindications: 'Liver disease, pregnancy, breastfeeding',
    storage: 'Store at room temperature away from moisture and heat.',
    ndcCode: '0071-0155-23',
    gsn: 12345
  },
  {
    brandName: 'Crestor',
    genericName: 'rosuvastatin',
    description: 'Used to lower cholesterol and triglycerides in the blood.',
    dosage: '5mg, 10mg, 20mg, 40mg tablets',
    sideEffects: 'Headache, muscle aches, abdominal pain, weakness, nausea',
    contraindications: 'Liver disease, pregnancy, breastfeeding',
    storage: 'Store at room temperature away from moisture and heat.',
    ndcCode: '0310-0755-90',
    gsn: 67890
  }
];

export default function MedicationDemoPage() {
  const [selectedTab, setSelectedTab] = useState<'comparison' | 'alternatives'>('comparison');
  const [selectedMedication, setSelectedMedication] = useState<string>(sampleMedications[0].genericName);
  
  // Mock user location (San Francisco)
  const userLocation = {
    latitude: 37.7749,
    longitude: -122.4194
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Medication Features Demo</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-6 py-3 text-lg font-medium ${
              selectedTab === 'comparison'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            onClick={() => setSelectedTab('comparison')}
          >
            Medication Comparison
          </button>
          <button
            className={`px-6 py-3 text-lg font-medium ${
              selectedTab === 'alternatives'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            onClick={() => setSelectedTab('alternatives')}
          >
            Medication Alternatives
          </button>
        </div>
        
        <div className="p-6">
          {selectedTab === 'comparison' ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Medication Comparison</h2>
                <p className="text-gray-600">
                  Compare multiple medications side by side to see differences in pricing, dosage, and other important details.
                </p>
              </div>
              
              <MedicationComparison 
                medications={sampleMedications}
                latitude={userLocation.latitude}
                longitude={userLocation.longitude}
                radius={10}
              />
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Medication Alternatives</h2>
                <p className="text-gray-600">
                  Find lower-cost alternatives to your current medications, including generic and therapeutic equivalents.
                </p>
                
                <div className="mt-4 mb-6">
                  <label htmlFor="medication-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Select a medication to find alternatives:
                  </label>
                  <select
                    id="medication-select"
                    value={selectedMedication}
                    onChange={(e) => setSelectedMedication(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    {sampleMedications.map((med) => (
                      <option key={med.ndcCode} value={med.genericName}>
                        {med.brandName} ({med.genericName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <MedicationAlternatives
                drugName={selectedMedication}
                latitude={userLocation.latitude}
                longitude={userLocation.longitude}
                includeGenerics={true}
                includeTherapeutic={true}
              />
            </>
          )}
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-2">About This Demo</h2>
        <p className="text-blue-700 mb-4">
          This page demonstrates the new medication comparison and alternatives features that have been added to the Rx website.
        </p>
        <ul className="list-disc list-inside text-blue-600 space-y-2">
          <li>The <strong>Medication Comparison</strong> feature allows users to compare multiple medications side by side.</li>
          <li>The <strong>Medication Alternatives</strong> feature helps users find lower-cost alternatives to their current medications.</li>
          <li>Both features use the user's location to find nearby pharmacies with the best prices.</li>
          <li>These components can be integrated into various parts of the application as needed.</li>
        </ul>
      </div>
    </div>
  );
} 