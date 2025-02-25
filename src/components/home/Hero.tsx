'use client'
import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function Hero() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <section className="relative bg-gradient-to-b from-light to-white py-20 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-dark mb-6">
            We Help You Save Up to 80% on Prescriptions
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Because Meds Shouldn't Break the Bank
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="flex items-center bg-white rounded-full shadow-lg p-2">
              <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 ml-3" />
              <input
                type="text"
                placeholder="Enter medication name..."
                className="flex-1 px-4 py-3 focus:outline-none text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-full font-semibold transition-all transform hover:scale-105">
                Search
              </button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="font-bold text-2xl text-primary mb-1">59,000+</div>
              <div className="text-gray-600">Participating Pharmacies</div>
            </div>
            <div>
              <div className="font-bold text-2xl text-primary mb-1">1M+</div>
              <div className="text-gray-600">Customers Served</div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="font-bold text-2xl text-primary mb-1">$500M+</div>
              <div className="text-gray-600">Customer Savings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-secondary/5 rounded-full blur-3xl" />
      </div>
    </section>
  )
} 