import { useState, useEffect } from 'react';
import { getDrugInfo, getDrugDetailsByGsn } from '@/services/medicationApi';
import { DrugDetails } from '@/types/api';

interface DrugInfoCardProps {
  drugName: string;
  gsn?: number;
  languageCode?: string;
}

export default function DrugInfoCard({ drugName, gsn, languageCode }: DrugInfoCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drugInfo, setDrugInfo] = useState<DrugDetails | null>(null);

  useEffect(() => {
    async function fetchDrugInfo() {
      try {
        setLoading(true);
        setError(null);
        
        let info: DrugDetails;
        
        // If GSN is provided, use it to fetch drug details
        if (gsn) {
          info = await getDrugDetailsByGsn(gsn, languageCode);
        } else {
          // Otherwise, fetch by drug name
          info = await getDrugInfo(drugName, languageCode);
        }
        
        setDrugInfo(info);
      } catch (err) {
        console.error('Error fetching drug information:', err);
        setError('Failed to load drug information. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (drugName || gsn) {
      fetchDrugInfo();
    }
  }, [drugName, gsn, languageCode]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-4/5 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-700 mb-2">Error</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!drugInfo) {
    return null;
  }

  // Helper function to render a section if the data exists
  const renderSection = (title: string, content?: string) => {
    if (!content) return null;
    
    return (
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-700">{content}</p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{drugInfo.brandName}</h2>
        <p className="text-gray-600">{drugInfo.genericName}</p>
      </div>
      
      <div className="p-6">
        {renderSection("Description", drugInfo.description)}
        {renderSection("Administration", drugInfo.admin)}
        {renderSection("Dosage Information", drugInfo.dosage)}
        {renderSection("Side Effects", drugInfo.sideEffects || drugInfo.side)}
        {renderSection("Drug Interactions", drugInfo.interaction)}
        {renderSection("Missed Dose Information", drugInfo.missedD)}
        {renderSection("Monitoring Requirements", drugInfo.monitor)}
        {renderSection("Storage Instructions", drugInfo.storage || drugInfo.store)}
        {renderSection("Contraindications", drugInfo.contraindications)}
        
        {drugInfo.disclaimer && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p>{drugInfo.disclaimer}</p>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-gray-50 text-sm text-gray-500">
        <p>This information is for educational purposes only. Always consult your healthcare provider for medical advice.</p>
      </div>
    </div>
  );
} 