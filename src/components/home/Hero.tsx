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
  const [useDirectApi, setUseDirectApi] = useState(false)

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
      // Navigate to the drug page with GSN if available
      if (selectedMedication?.gsn) {
        router.push(`/drug/${encodeURIComponent(medication)}?gsn=${selectedMedication.gsn}`)
      } else {
        router.push(`/drug/${encodeURIComponent(medication)}`)
      }
    } catch (error) {
      console.error('Error during search:', error)
    } finally {
      setIsSearching(false)
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
          <div className="max-w-2xl mx-auto">
            <MedicationSearch 
              value={medication} 
              onChange={handleMedicationChange}
              onSearch={handleSearch}
              useDirectApi={useDirectApi}
            />
            
            {/* API Toggle (for development/testing) */}
            <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useDirectApi}
                  onChange={() => setUseDirectApi(!useDirectApi)}
                  className="form-checkbox h-4 w-4 text-[#006B52] rounded"
                />
                <span className="ml-2">Use direct API (for testing)</span>
              </label>
            </div>
          </div>

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