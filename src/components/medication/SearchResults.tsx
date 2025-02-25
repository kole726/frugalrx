'use client'
import { motion } from 'framer-motion'

interface SearchResultsProps {
  results: {
    pharmacyName: string;
    address: string;
    price: number;
    distance: number;
  }[];
}

export default function SearchResults({ results }: SearchResultsProps) {
  if (!results.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-dark mb-4">No Results Found</h2>
        <p className="text-gray-600">Try adjusting your search terms or location</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl font-bold text-dark mb-8">Search Results</h2>
      <div className="grid gap-6">
        {results.map((result, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-dark">{result.pharmacyName}</h3>
                <p className="text-gray-600">{result.address}</p>
                <p className="text-sm text-gray-500">{result.distance} miles away</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">${result.price}</div>
                <button className="mt-2 bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  Get Coupon
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
} 