'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface MedicationSearchResultsProps {
  results: {
    drugName: string;
    gsn?: number;
  }[];
  isLoading?: boolean;
  languageCode?: string;
}

export default function MedicationSearchResults({ results, isLoading = false, languageCode = 'en' }: MedicationSearchResultsProps) {
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Medications Found</h2>
        <p className="text-gray-600">Try adjusting your search terms</p>
      </div>
    );
  }

  // Helper function to build the URL with parameters
  const buildMedicationUrl = (drugName: string, gsn?: number) => {
    let url = `/medications/${encodeURIComponent(drugName)}`;
    const params = new URLSearchParams();
    
    if (gsn) {
      params.append('gsn', gsn.toString());
    }
    
    if (languageCode && languageCode !== 'en') {
      params.append('lang', languageCode);
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    return url;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Medication Results</h2>
      <div className="grid gap-4">
        {results.map((result, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link 
              href={buildMedicationUrl(result.drugName, result.gsn)}
              className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{result.drugName}</h3>
                  {result.gsn && (
                    <p className="text-sm text-gray-500">GSN: {result.gsn}</p>
                  )}
                </div>
                <div className="text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 