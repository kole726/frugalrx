"use client"
import { useState } from "react"
import { MapPinIcon } from "@heroicons/react/24/outline"

export default function PharmacyLocator() {
  const [zipCode, setZipCode] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement Google Maps API integration
    console.log("Searching pharmacies in:", zipCode)
  }

  return (
    <div className="mt-16 bg-white rounded-2xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="p-8 text-center">
        <h3 className="text-2xl font-bold text-[#2C3E50] mb-4">
          Find Participating Pharmacies Near You
        </h3>
        <p className="text-gray-500 mb-6">
          Enter your location to find the closest pharmacies that accept FrugalRx
        </p>
        
        <form onSubmit={handleSearch} className="flex max-w-md mx-auto">
          <div className="relative flex-1">
            <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter ZIP code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button 
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-r-lg font-semibold transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Map Preview - Will be replaced with actual Google Maps */}
      <div className="relative h-64 bg-[#F8FAFC]">
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          Map Preview Coming Soon
        </div>
      </div>
    </div>
  )
} 