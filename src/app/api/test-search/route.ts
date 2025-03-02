import { NextResponse } from 'next/server';
import { DrugInfo } from '@/types/api';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// Helper function to capitalize the first letter of each word
function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export async function GET(request: Request) {
  try {
    // Get the search query from the URL
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    
    if (!query) {
      console.error('Test API: Missing search query parameter');
      return NextResponse.json(
        { error: 'Search query is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    console.log(`Test API: Searching for medications with query: ${query}`);
    
    // Generate mock results based on the query
    const mockResults: DrugInfo[] = [
      {
        gsn: 12345,
        brandName: `${capitalizeWords(query)}`,
        genericName: `${capitalizeWords(query)}`,
        ndcCode: '12345-678-90',
        dosage: '10mg',
        form: 'Tablet'
      },
      {
        gsn: 67890,
        brandName: `${capitalizeWords(query)} XR`,
        genericName: `${capitalizeWords(query)}`,
        ndcCode: '67890-123-45',
        dosage: '20mg',
        form: 'Capsule'
      },
      {
        gsn: 54321,
        brandName: '',
        genericName: `${capitalizeWords(query)} Generic`,
        ndcCode: '54321-987-65',
        dosage: '15mg',
        form: 'Tablet'
      }
    ];
    
    // Add more realistic drug suggestions that start with the query
    if (query.toLowerCase().startsWith('t')) {
      mockResults.push(
        {
          gsn: 11111,
          brandName: 'Tylenol',
          genericName: 'Acetaminophen',
          ndcCode: '11111-222-33',
          dosage: '500mg',
          form: 'Tablet'
        },
        {
          gsn: 22222,
          brandName: 'Tylenol PM',
          genericName: 'Acetaminophen/Diphenhydramine',
          ndcCode: '22222-333-44',
          dosage: '500mg/25mg',
          form: 'Tablet'
        },
        {
          gsn: 33333,
          brandName: 'Tamiflu',
          genericName: 'Oseltamivir',
          ndcCode: '33333-444-55',
          dosage: '75mg',
          form: 'Capsule'
        }
      );
    } else if (query.toLowerCase().startsWith('a')) {
      mockResults.push(
        {
          gsn: 44444,
          brandName: 'Advil',
          genericName: 'Ibuprofen',
          ndcCode: '44444-555-66',
          dosage: '200mg',
          form: 'Tablet'
        },
        {
          gsn: 55555,
          brandName: 'Allegra',
          genericName: 'Fexofenadine',
          ndcCode: '55555-666-77',
          dosage: '180mg',
          form: 'Tablet'
        },
        {
          gsn: 66666,
          brandName: 'Ambien',
          genericName: 'Zolpidem',
          ndcCode: '66666-777-88',
          dosage: '10mg',
          form: 'Tablet'
        }
      );
    } else if (query.toLowerCase().startsWith('l')) {
      mockResults.push(
        {
          gsn: 77777,
          brandName: 'Lipitor',
          genericName: 'Atorvastatin',
          ndcCode: '77777-888-99',
          dosage: '20mg',
          form: 'Tablet'
        },
        {
          gsn: 88888,
          brandName: 'Lexapro',
          genericName: 'Escitalopram',
          ndcCode: '88888-999-00',
          dosage: '10mg',
          form: 'Tablet'
        },
        {
          gsn: 99999,
          brandName: 'Loratadine',
          genericName: 'Loratadine',
          ndcCode: '99999-000-11',
          dosage: '10mg',
          form: 'Tablet'
        }
      );
    }
    
    console.log(`Test API: Returning ${mockResults.length} mock search results for query: ${query}`);
    
    // Add CORS headers
    return NextResponse.json(mockResults, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Error in test search API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
} 