import { NextResponse } from 'next/server';
import { getDrugInfoByName } from '@/lib/server/medicationService';
import { searchDrugs } from '@/lib/server/medicationService';
import { findGsnByDrugName } from '@/lib/drug-gsn-mapping';
import { DrugDetails, APIError } from '@/types/api';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get the drug name from the URL query parameter
    const url = new URL(request.url);
    const drugName = url.searchParams.get('name');
    
    if (!drugName) {
      console.error('API: Missing drug name parameter');
      return NextResponse.json(
        { error: 'Drug name is required' },
        { status: 400 }
      );
    }
    
    console.log(`API: Getting drug info for: ${drugName}`);
    
    // First, search for the drug to get its GSN using our enhanced search
    try {
      const searchResults = await searchDrugs(drugName);
      
      if (!Array.isArray(searchResults) || searchResults.length === 0) {
        console.error(`API: No drug found with name: ${drugName}`);
        throw new Error(`Drug not found: ${drugName}`);
      }
      
      // Find the exact match or closest match
      const exactMatch = searchResults.find(
        drug => drug.drugName.toLowerCase() === drugName.toLowerCase()
      );
      
      const drugToUse = exactMatch || searchResults[0];
      console.log(`API: Using drug: ${drugToUse.drugName} for info lookup`);
      
      // If we have a GSN, use it to get detailed information
      if (drugToUse.gsn) {
        console.log(`API: Retrieving drug details by GSN: ${drugToUse.gsn}`);
        try {
          const drugInfo = await getDrugInfoByName(drugToUse.drugName);
          
          // Log the drug info we're returning
          console.log(`API: Returning drug info for ${drugToUse.drugName}:`, drugInfo);
          
          return NextResponse.json({
            ...drugInfo,
            gsn: drugToUse.gsn
          });
        } catch (error) {
          console.error(`API: Error fetching drug info for ${drugToUse.drugName}:`, error);
          throw error;
        }
      } else {
        // If no GSN, just get the drug info by name
        const drugInfo = await getDrugInfoByName(drugName);
        console.log(`API: Returning drug info for ${drugName} (no GSN):`, drugInfo);
        
        return NextResponse.json(drugInfo);
      }
    } catch (searchError) {
      console.error('API: Error searching for drug:', searchError);
      
      // Fall back to direct drug info lookup
      try {
        const drugInfo = await getDrugInfoByName(drugName);
        console.log(`API: Returning drug info for ${drugName} (fallback):`, drugInfo);
        
        return NextResponse.json(drugInfo);
      } catch (infoError) {
        console.error('API: Error fetching drug info in fallback:', infoError);
        throw infoError;
      }
    }
  } catch (error) {
    console.error('Error in drug info API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 