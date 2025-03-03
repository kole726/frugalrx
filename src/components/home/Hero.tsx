'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MedicationSearch from './MedicationSearch'

interface SelectedMedication {
  name: string;
  gsn?: number;
}

export default function Hero() {
  const router = useRouter()
  const [medication, setMedication] = useState('')
  const [selectedMedication, setSelectedMedication] = useState<SelectedMedication | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleMedicationChange = (value: string, gsn?: number) => {
    setMedication(value)
    if (gsn) {
      setSelectedMedication({ name: value, gsn })
    } else {
      // If no GSN is provided, we're just typing, not selecting from dropdown
      setSelectedMedication(null)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!medication) return
    
    try {
      setIsSearching(true)
      
      // Always convert medication name to lowercase for URLs
      const normalizedMedication = medication.toLowerCase()
      
      // Navigate to the drug detail page with GSN if available
      if (selectedMedication?.gsn) {
        console.log(`Navigating to drug page with GSN: ${selectedMedication.gsn}`)
        router.push(`/drug/${encodeURIComponent(normalizedMedication)}?gsn=${selectedMedication.gsn}`)
      } else {
        console.log(`Navigating to drug page without GSN: ${normalizedMedication}`)
        router.push(`/drug/${encodeURIComponent(normalizedMedication)}`)
      }
    } catch (error) {
      console.error('Error during search:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <section className="relative bg-gradient-to-b from-[#EFFDF6] to-white pt-16 md:pt-20 pb-16 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#2C3E50] mb-4 md:mb-6 leading-tight">
            We Help You Save Up to 80% on Prescriptions
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 md:mb-12">
            Because Meds Shouldn't Break the Bank
          </p>

          {/* Search Form */}
          <div className="max-w-2xl mx-auto">
            <MedicationSearch 
              value={medication} 
              onChange={handleMedicationChange}
              onSearch={handleSearch}
            />
            {isSearching && (
              <div className="mt-2 text-sm text-gray-600">
                Searching...
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white/50 p-4 rounded-lg shadow-sm">
              <div className="text-[#006B52] font-bold text-xl md:text-2xl">59,000+</div>
              <div className="text-gray-600 text-sm md:text-base">Participating Pharmacies</div>
            </div>
            <div className="bg-white/50 p-4 rounded-lg shadow-sm">
              <div className="text-[#006B52] font-bold text-xl md:text-2xl">1M+</div>
              <div className="text-gray-600 text-sm md:text-base">Customers Served</div>
            </div>
            <div className="bg-white/50 p-4 rounded-lg shadow-sm">
              <div className="text-[#006B52] font-bold text-xl md:text-2xl">$500M+</div>
              <div className="text-gray-600 text-sm md:text-base">Customer Savings</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 