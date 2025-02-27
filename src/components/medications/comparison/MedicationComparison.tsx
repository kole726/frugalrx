import React, { useState, useEffect } from 'react';
import { compareMedicationsClient } from '@/services/medicationApi';
import { DrugInfo, PharmacyPrice } from '@/types/api';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface MedicationComparisonProps {
  medications: Array<{ name?: string; gsn?: number }>;
  latitude: number;
  longitude: number;
  radius?: number;
}

export default function MedicationComparison({ 
  medications, 
  latitude, 
  longitude, 
  radius 
}: MedicationComparisonProps) {
  const [comparisonData, setComparisonData] = useState<Array<DrugInfo & { prices: PharmacyPrice[] }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'prices' | 'details'>('overview');
  const router = useRouter();

  useEffect(() => {
    const fetchComparisonData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await compareMedicationsClient(medications, latitude, longitude, radius);
        setComparisonData(data);
      } catch (err) {
        console.error('Error fetching comparison data:', err);
        setError('Failed to load medication comparison data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (medications.length > 0) {
      fetchComparisonData();
    }
  }, [medications, latitude, longitude, radius]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-medium text-gray-700">Loading medication comparison...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-4">
        <h3 className="text-lg font-semibold text-red-700 mb-2">Error</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (comparisonData.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 my-4">
        <h3 className="text-lg font-semibold text-yellow-700 mb-2">No Comparison Data</h3>
        <p className="text-yellow-600">No medications were found to compare. Please try different medications.</p>
        <button 
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('prices')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'prices'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Prices
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Details
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feature
                  </th>
                  {comparisonData.map((med, index) => (
                    <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {med.brandName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Generic Name
                  </td>
                  {comparisonData.map((med, index) => (
                    <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {med.genericName}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Lowest Price
                  </td>
                  {comparisonData.map((med, index) => {
                    const lowestPrice = med.prices.length > 0 
                      ? Math.min(...med.prices.map(p => p.price))
                      : null;
                    
                    return (
                      <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lowestPrice !== null 
                          ? `$${lowestPrice.toFixed(2)}` 
                          : 'No price data'}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Dosage
                  </td>
                  {comparisonData.map((med, index) => (
                    <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {med.dosage || 'Not available'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'prices' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparisonData.map((med, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-blue-800">{med.brandName}</h3>
                  <p className="text-sm text-blue-600">{med.genericName}</p>
                </div>
                <div className="p-4">
                  <h4 className="text-md font-medium text-gray-700 mb-2">Prices at Nearby Pharmacies</h4>
                  {med.prices.length > 0 ? (
                    <ul className="space-y-2">
                      {med.prices.sort((a, b) => a.price - b.price).map((price, priceIndex) => (
                        <li key={priceIndex} className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">{price.name}</span>
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-semibold text-gray-800">${price.price.toFixed(2)}</span>
                            <span className="text-xs text-gray-500">{price.distance}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No price information available</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-8">
            {comparisonData.map((med, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-blue-800">{med.brandName}</h3>
                  <p className="text-sm text-blue-600">{med.genericName}</p>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-1">Description</h4>
                    <p className="text-sm text-gray-600">{med.description || 'No description available'}</p>
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-1">Side Effects</h4>
                    <p className="text-sm text-gray-600">{med.sideEffects || 'No side effects information available'}</p>
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-1">Dosage</h4>
                    <p className="text-sm text-gray-600">{med.dosage || 'No dosage information available'}</p>
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-1">Storage</h4>
                    <p className="text-sm text-gray-600">{med.storage || 'No storage information available'}</p>
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-1">Contraindications</h4>
                    <p className="text-sm text-gray-600">{med.contraindications || 'No contraindication information available'}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 