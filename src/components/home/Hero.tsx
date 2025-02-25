'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MedicationSearch from './MedicationSearch'

export default function Hero() {
  const router = useRouter()
  const [medication, setMedication] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (medication) {
      router.push(`/drug/${encodeURIComponent(medication)}`)
    }
  }

  return (
    <section className="relative bg-gradient-to-b from-[#EFFDF6] to-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2C3E50] mb-6">
            We Help You Save Up to 80% on Prescriptions
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Because Meds Shouldn't Break the Bank
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
            <div className="flex-1">
              <MedicationSearch 
                value={medication} 
                onChange={setMedication}
              />
            </div>

            <button 
              type="submit"
              className="bg-[#FF1B75] hover:bg-[#FF1B75]/90 text-white px-8 py-3 rounded-full font-semibold"
            >
              Search
            </button>
          </form>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8">
            <div>
              <div className="text-[#006B52] font-bold text-2xl">59,000+</div>
              <div className="text-gray-600">Participating Pharmacies</div>
            </div>
            <div>
              <div className="text-[#006B52] font-bold text-2xl">1M+</div>
              <div className="text-gray-600">Customers Served</div>
            </div>
            <div>
              <div className="text-[#006B52] font-bold text-2xl">$500M+</div>
              <div className="text-gray-600">Customer Savings</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 