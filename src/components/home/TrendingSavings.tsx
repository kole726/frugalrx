'use client'
import { useState } from 'react'
import { motion, Variants } from "framer-motion"

// Sample data - we can move this to a separate file later
const trendingMeds = [
  {
    id: 1,
    name: 'Metformin',
    generic: 'Metformin HCL',
    originalPrice: 84.99,
    discountPrice: 14.99,
    savings: 82,
    image: '/images/meds/metformin.png', // We'll need to add these images
    pharmacies: ['CVS', 'Walgreens', 'Walmart']
  },
  {
    id: 2,
    name: 'Lisinopril',
    generic: 'Lisinopril',
    originalPrice: 45.99,
    discountPrice: 8.99,
    savings: 80,
    image: '/images/meds/lisinopril.png',
    pharmacies: ['Walmart', 'Rite Aid', 'CVS']
  },
  {
    id: 3,
    name: 'Amoxicillin',
    generic: 'Amoxicillin',
    originalPrice: 32.99,
    discountPrice: 7.99,
    savings: 76,
    image: '/images/meds/amoxicillin.png',
    pharmacies: ['Walgreens', 'CVS', 'Walmart']
  }
]

export default function TrendingSavings() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const fadeIn: Variants = {
    initial: { 
      opacity: 0, 
      y: 20 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  const staggerChildren: Variants = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <section className="py-24">
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerChildren}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-dark mb-4">
            Trending Savings
          </h2>
          <p className="text-xl text-gray-600">
            Popular medications with big discounts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trendingMeds.map((med) => (
            <div
              key={med.id}
              className={`bg-white rounded-2xl shadow-lg transition-all duration-300 ${
                hoveredCard === med.id ? 'transform -translate-y-2' : ''
              }`}
              onMouseEnter={() => setHoveredCard(med.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-dark">{med.name}</h3>
                  <span className="bg-light text-primary px-3 py-1 rounded-full text-sm font-semibold">
                    Save {med.savings}%
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">{med.generic}</p>
                
                <div className="flex items-baseline mb-6">
                  <span className="text-2xl font-bold text-primary">
                    ${med.discountPrice}
                  </span>
                  <span className="ml-2 text-gray-500 line-through">
                    ${med.originalPrice}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Available at:</span>
                    <div className="flex space-x-2">
                      {med.pharmacies.map((pharmacy) => (
                        <span
                          key={pharmacy}
                          className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm"
                        >
                          {pharmacy}
                        </span>
                      ))}
                    </div>
                  </div>

                  <a 
                    href={`/drug/${med.name.toUpperCase()}`}
                    className="block w-full bg-accent hover:bg-accent/90 text-white py-2 rounded-lg font-semibold text-center transition-colors"
                  >
                    Get Discount
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="inline-flex items-center text-primary hover:text-primary/80 font-semibold transition-colors">
            View All Medications
            <svg
              className="ml-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </motion.div>
    </section>
  )
} 