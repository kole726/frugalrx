import React, { useState, useEffect } from 'react';
import { getMedicationAlternatives } from '@/services/medicationApi';
import { DrugInfo } from '@/types/api';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface MedicationAlternativesProps {
  medicationId: string;
  medicationName: string;
}

export default function MedicationAlternatives({ medicationId, medicationName }: MedicationAlternativesProps) {
  const [alternatives, setAlternatives] = useState<DrugInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlternatives = async () => {
      if (!medicationId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getMedicationAlternatives(
          medicationName,
          37.7749, // Default latitude (San Francisco)
          -122.4194, // Default longitude (San Francisco)
          true, // Include generics
          false // Include therapeutic alternatives
        );
        setAlternatives(data);
      } catch (err) {
        console.error('Error fetching medication alternatives:', err);
        setError('Failed to load medication alternatives. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlternatives();
  }, [medicationId, medicationName]);

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Alternative Medications</h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading alternatives...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Alternative Medications</h2>
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (alternatives.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Alternative Medications</h2>
        <p className="text-gray-600">No alternative medications found for {medicationName}.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Alternative Medications for {medicationName}</h2>
      <p className="text-gray-600 mb-4">
        These medications may be used for similar conditions. Always consult with your healthcare provider before switching medications.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {alternatives.map((alternative, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-lg text-blue-700">
              {alternative.brandName || alternative.genericName}
            </h3>
            
            {alternative.brandName && alternative.genericName && (
              <p className="text-sm text-gray-600 mt-1">
                {alternative.genericName !== alternative.brandName ? alternative.genericName : ''}
              </p>
            )}
            
            {alternative.strength && (
              <p className="text-sm text-gray-700 mt-2">
                <span className="font-medium">Strength:</span> {alternative.strength}
              </p>
            )}
            
            {alternative.form && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Form:</span> {alternative.form}
              </p>
            )}
            
            <div className="mt-3 flex justify-between items-center">
              <Link 
                href={`/drug/${alternative.genericName?.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Details
              </Link>
              
              {alternative.prices && alternative.prices.length > 0 && (
                <span className="text-green-600 font-medium">
                  From ${Math.min(...alternative.prices.map(p => p.price)).toFixed(2)}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 