'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline'
import MedicationSearch from './MedicationSearch'
import Image from 'next/image'

export default function Hero() {
  const router = useRouter()
  const [medication, setMedication] = useState('')
  const [location, setLocation] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (medication && location) {
      router.push(`/search?medication=${encodeURIComponent(medication)}&location=${encodeURIComponent(location)}`)
    }
  }

  return (
    <section className="relative bg-gradient-to-b from-[#EFFDF6] to-white py-24">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="/images/hero-image.jpg"
          alt="Hero"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2C3E50] mb-6">
              We Help You Save Up to 80% on Prescriptions
            </h1>
            <p className="text-xl text-gray-500 mb-12">
              Because Meds Shouldn&apos;t Break the Bank
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative z-10">
              <div className="flex flex-col md:flex-row gap-4">
                <MedicationSearch value={medication} onChange={setMedication} />

                {/* Location Search */}
                <div className="flex-1">
                  <div className="flex items-center bg-white rounded-full shadow-lg p-2">
                    <MapPinIcon className="h-6 w-6 text-gray-400 ml-3" />
                    <input
                      type="text"
                      placeholder="Enter ZIP code..."
                      className="flex-1 px-4 py-3 focus:outline-none text-lg rounded-full"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-full font-semibold transition-all transform hover:scale-105 md:self-stretch md:flex md:items-center"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Trust Indicators */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="font-bold text-2xl text-primary mb-1">59,000+</div>
                <div className="text-gray-500">Participating Pharmacies</div>
              </div>
              <div>
                <div className="font-bold text-2xl text-primary mb-1">1M+</div>
                <div className="text-gray-500">Customers Served</div>
              </div>
              <div className="col-span-2 md:col-span-1">
                <div className="font-bold text-2xl text-primary mb-1">$500M+</div>
                <div className="text-gray-500">Customer Savings</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-20">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-[#EFFDF6]/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-[#EFFDF6]/30 rounded-full blur-3xl" />
      </div>
    </section>
  )
} 