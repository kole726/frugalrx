"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface MedicationAlternativesProps {
  medicationId: string;
  medicationName: string;
}

interface AlternativeMedication {
  id: string;
  name: string;
  description: string;
  price: number;
  savings: number;
}

export default function MedicationAlternatives({ medicationId, medicationName }: MedicationAlternativesProps) {
  const [alternatives, setAlternatives] = useState<AlternativeMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlternatives = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real app, we would fetch alternatives from an API
        // For now, we'll simulate a delay and return mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate mock alternatives
        const mockAlternatives: AlternativeMedication[] = [
          {
            id: '1',
            name: `Generic ${medicationName}`,
            description: 'Generic version with the same active ingredients',
            price: 24.99,
            savings: 65
          },
          {
            id: '2',
            name: `${medicationName} Alternative 1`,
            description: 'Similar medication with comparable effects',
            price: 19.99,
            savings: 75
          },
          {
            id: '3',
            name: `${medicationName} Alternative 2`,
            description: 'Different medication class with similar therapeutic effect',
            price: 29.99,
            savings: 55
          }
        ];
        
        setAlternatives(mockAlternatives);
      } catch (err) {
        console.error('Error fetching medication alternatives:', err);
        setError('Failed to load alternative medications. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (medicationId || medicationName) {
      fetchAlternatives();
    }
  }, [medicationId, medicationName]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006142]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!alternatives.length) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No alternative medications found for {medicationName}.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {alternatives.map((alternative) => (
        <div 
          key={alternative.id}
          className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="bg-[#EFFDF6] p-4">
            <h3 className="font-semibold text-gray-800">{alternative.name}</h3>
          </div>
          <div className="p-4">
            <p className="text-gray-600 mb-4">{alternative.description}</p>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-500">Average Price</p>
                <p className="text-xl font-bold text-[#006142]">${alternative.price.toFixed(2)}</p>
              </div>
              <div className="bg-[#EFFDF6] px-3 py-1 rounded-full">
                <p className="text-sm font-medium text-[#006142]">Save {alternative.savings}%</p>
              </div>
            </div>
            <Link 
              href={`/drug/${encodeURIComponent(alternative.name)}`}
              className="block w-full text-center bg-[#006142] text-white py-2 rounded-md hover:bg-[#22A307] transition-colors"
            >
              View Prices
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
} 