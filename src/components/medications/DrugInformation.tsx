import { useState } from 'react';
import { DrugDetails } from '@/types/api';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface DrugInformationProps {
  drugName: string;
  drugDetails: DrugDetails | null;
  detailedInfo?: any;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
  gsn?: number | string;
}

export default function DrugInformation({ 
  drugName, 
  drugDetails, 
  detailedInfo, 
  className = '',
  isLoading = false,
  error = null,
  gsn
}: DrugInformationProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  // Helper function to build the detailed info URL
  const buildDetailedInfoUrl = () => {
    if (!gsn) return null;
    
    return `/drug-info/${gsn}/B/`;
  };

  const detailedInfoUrl = buildDetailedInfoUrl();
  
  // Helper function to get the most appropriate value from multiple possible fields
  const getFieldValue = (fieldNames: string[], defaultValue: string = 'No information available.'): string => {
    // First check detailed info
    if (detailedInfo) {
      for (const field of fieldNames) {
        if (detailedInfo[field]) return detailedInfo[field];
      }
    }
    
    // Then check drug details
    if (drugDetails) {
      for (const field of fieldNames) {
        if (drugDetails[field as keyof DrugDetails]) return drugDetails[field as keyof DrugDetails] as string;
      }
    }
    
    return defaultValue;
  };

  // Helper function to check if a section has content
  const hasContent = (fieldNames: string[]): boolean => {
    return getFieldValue(fieldNames, '') !== '';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${className}`}
    >
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-4 bg-[#006142] text-white rounded-t-lg shadow-md"
      >
        <span className="font-medium">{drugName?.toUpperCase()} DRUG INFORMATION</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-5 w-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="p-6 border border-gray-200 rounded-b-lg shadow-md bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006142] mb-4"></div>
              <p className="text-gray-600">Loading drug information...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="prose max-w-none">
              {/* View Detailed Information Link */}
              {detailedInfoUrl && (
                <div className="mb-6 flex justify-end">
                  <Link 
                    href={detailedInfoUrl}
                    className="inline-flex items-center text-[#006142] hover:underline"
                  >
                    <span>View Detailed Drug Information</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              )}
              
              {!detailedInfo && drugDetails && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-700">
                    <strong>Note:</strong> We're showing basic drug information. For more detailed information, please consult with your healthcare provider.
                  </p>
                </div>
              )}
              
              {/* Drug Name Information */}
              <div className="mb-6">
                <div className="mb-2">
                  <span className="font-semibold text-gray-700">Brand Name:</span> {getFieldValue(['brandName'])}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Generic Name:</span> {getFieldValue(['genericName'])}
                </div>
                {detailedInfo?.strength && (
                  <div className="mt-2">
                    <span className="font-semibold text-gray-700">Strength:</span> {detailedInfo.strength}
                  </div>
                )}
                {detailedInfo?.form && (
                  <div className="mt-2">
                    <span className="font-semibold text-gray-700">Form:</span> {detailedInfo.form}
                  </div>
                )}
              </div>
              
              {/* Tabbed Navigation */}
              <div className="mb-6 border-b border-gray-200">
                <nav className="flex flex-wrap -mb-px">
                  <button
                    onClick={() => setActiveTab('general')}
                    className={`mr-2 py-2 px-4 font-medium text-sm border-b-2 ${
                      activeTab === 'general'
                        ? 'border-[#006142] text-[#006142]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    General Information
                  </button>
                  <button
                    onClick={() => setActiveTab('usage')}
                    className={`mr-2 py-2 px-4 font-medium text-sm border-b-2 ${
                      activeTab === 'usage'
                        ? 'border-[#006142] text-[#006142]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Usage & Dosage
                  </button>
                  <button
                    onClick={() => setActiveTab('safety')}
                    className={`mr-2 py-2 px-4 font-medium text-sm border-b-2 ${
                      activeTab === 'safety'
                        ? 'border-[#006142] text-[#006142]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Safety Information
                  </button>
                  <button
                    onClick={() => setActiveTab('special')}
                    className={`py-2 px-4 font-medium text-sm border-b-2 ${
                      activeTab === 'special'
                        ? 'border-[#006142] text-[#006142]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Special Populations
                  </button>
                </nav>
              </div>
              
              {/* Tab Content */}
              <div className="mt-4">
                {/* General Information Tab */}
                {activeTab === 'general' && (
                  <div>
                    {/* Description */}
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Description</h3>
                    <p className="mb-4 text-gray-700">
                      {getFieldValue(['description'])}
                    </p>
                    
                    {/* Indications */}
                    {hasContent(['indications', 'uses']) && (
                      <>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Indications</h3>
                        <p className="mb-4 text-gray-700">
                          {getFieldValue(['indications', 'uses'])}
                        </p>
                      </>
                    )}
                    
                    {/* Storage */}
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Storage</h3>
                    <p className="mb-4 text-gray-700">
                      {getFieldValue(['storage', 'store'], 'Store at room temperature away from moisture, heat, and light. Keep all medications away from children and pets.')}
                    </p>
                    
                    {/* Drug Interactions */}
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Drug Interactions</h3>
                    <p className="mb-4 text-gray-700">
                      {getFieldValue(['interaction'], 'Many medications can interact with each other. Tell your doctor about all your current medicines and any medicine you start or stop using.')}
                    </p>
                  </div>
                )}
                
                {/* Usage & Dosage Tab */}
                {activeTab === 'usage' && (
                  <div>
                    {/* Administration */}
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">How to Use</h3>
                    <p className="mb-4 text-gray-700">
                      {getFieldValue(['admin', 'howToUse'], 'Take this medication exactly as prescribed by your healthcare provider. Follow all directions on the prescription label and read all medication guides or instruction sheets.')}
                    </p>
                    
                    {/* Dosage */}
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Dosage</h3>
                    <p className="mb-4 text-gray-700">
                      {getFieldValue(['dosage', 'strength'], 'Dosage is determined by your healthcare provider based on your medical condition and response to treatment.')}
                    </p>
                    
                    {/* Missed Dose */}
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Missed Dose</h3>
                    <p className="mb-4 text-gray-700">
                      {getFieldValue(['missedD', 'missed'], 'If you miss a dose, take it as soon as you remember. Skip the missed dose if it is almost time for your next scheduled dose. Do not take extra medicine to make up the missed dose.')}
                    </p>
                    
                    {/* Monitoring */}
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Monitoring</h3>
                    <p className="mb-4 text-gray-700">
                      {getFieldValue(['monitor'], 'Your doctor may perform tests during treatment to monitor the effects of this medication on your body.')}
                    </p>
                    
                    {/* Overdose */}
                    {hasContent(['overdose']) && (
                      <>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Overdose</h3>
                        <p className="mb-4 text-gray-700">
                          {getFieldValue(['overdose'], 'In case of overdose, seek emergency medical attention or call the Poison Help line at 1-800-222-1222.')}
                        </p>
                      </>
                    )}
                  </div>
                )}
                
                {/* Safety Information Tab */}
                {activeTab === 'safety' && (
                  <div>
                    {/* Side Effects */}
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Side Effects</h3>
                    <p className="mb-4 text-gray-700">
                      {getFieldValue(['side', 'sideEffects'], 'Side effects may vary. Please consult with your healthcare provider for detailed information.')}
                    </p>
                    
                    {/* Warnings */}
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Warnings</h3>
                    <p className="mb-4 text-gray-700">
                      {getFieldValue(['warnings'], 'Follow all instructions and warnings on the medication label. Consult your healthcare provider about any specific warnings for this medication.')}
                    </p>
                    
                    {/* Precautions */}
                    {hasContent(['precautions']) && (
                      <>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Precautions</h3>
                        <p className="mb-4 text-gray-700">
                          {getFieldValue(['precautions'], 'Take precautions as directed by your healthcare provider.')}
                        </p>
                      </>
                    )}
                    
                    {/* Contraindications */}
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Contraindications</h3>
                    <p className="mb-4 text-gray-700">
                      {getFieldValue(['contraindications', 'contra'], 'Do not use this medication if you have certain medical conditions. Consult your healthcare provider for specific contraindication information.')}
                    </p>
                  </div>
                )}
                
                {/* Special Populations Tab */}
                {activeTab === 'special' && (
                  <div>
                    {/* Pregnancy */}
                    {hasContent(['pregnancy']) && (
                      <>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Pregnancy</h3>
                        <p className="mb-4 text-gray-700">
                          {getFieldValue(['pregnancy'], 'Consult your doctor if you are pregnant or plan to become pregnant.')}
                        </p>
                      </>
                    )}
                    
                    {/* Breastfeeding */}
                    {hasContent(['breastfeeding', 'nursing']) && (
                      <>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Breastfeeding</h3>
                        <p className="mb-4 text-gray-700">
                          {getFieldValue(['breastfeeding', 'nursing'], 'Consult your doctor if you are breastfeeding.')}
                        </p>
                      </>
                    )}
                    
                    {/* Pediatric Use */}
                    {hasContent(['pediatricUse', 'children']) && (
                      <>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Use in Children</h3>
                        <p className="mb-4 text-gray-700">
                          {getFieldValue(['pediatricUse', 'children'], 'Safety and effectiveness in children may vary. Consult your pediatrician.')}
                        </p>
                      </>
                    )}
                    
                    {/* Geriatric Use */}
                    {hasContent(['geriatricUse', 'elderly']) && (
                      <>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Use in Elderly</h3>
                        <p className="mb-4 text-gray-700">
                          {getFieldValue(['geriatricUse', 'elderly'], 'Elderly patients may be more sensitive to side effects. Dosage adjustments may be necessary.')}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Disclaimer */}
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Disclaimer</h3>
                <p className="text-gray-700 text-sm">
                  {getFieldValue(['disclaimer'], 'This information is provided for educational purposes only and is not intended as medical advice. Consult your healthcare provider for personalized recommendations.')}
                </p>
              </div>
              
              {/* View Detailed Information Link (Bottom) */}
              {detailedInfoUrl && (
                <div className="mt-6 text-center">
                  <Link 
                    href={detailedInfoUrl}
                    className="inline-flex items-center justify-center px-4 py-2 bg-[#006142] text-white rounded-lg hover:bg-[#004d35] transition-colors"
                  >
                    <span>View Detailed Drug Information</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
} 