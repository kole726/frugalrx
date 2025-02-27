"use client"
import Link from "next/link"
import Image from "next/image"

export default function Navigation() {
  return (
    <nav className="flex items-center space-x-8">
      <Link 
        href="/how-it-works"
        className="text-gray-600 hover:text-primary font-medium"
      >
        How It Works
      </Link>
      
      <Link 
        href="/medications/demo"
        className="text-gray-600 hover:text-primary font-medium"
      >
        Medication Features
      </Link>
      
      <Link 
        href="/medications/compare"
        className="text-gray-600 hover:text-primary font-medium"
      >
        Compare Medications
      </Link>
      
      {/* Download Card Dropdown */}
      <div className="relative group">
        <button className="bg-accent hover:bg-accent/90 text-white px-6 py-2.5 rounded-full font-medium">
          Download Card
        </button>
        
        {/* Dropdown Content */}
        <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-1">
          <div className="bg-white rounded-lg shadow-xl p-4 w-72">
            <div className="text-center mb-2">
              <h3 className="text-gray-600 text-sm">
                FrugalRx-QR-Code
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Scan The Code With Your Camera Phone To Download
              </p>
            </div>
            
            <div className="bg-[#37B34A] rounded-lg p-4">
              <div className="relative w-full aspect-square bg-white rounded-lg p-4">
                <Image
                  src="/images/qr/FrugalRx-QR-Code.svg"
                  alt="FrugalRx QR Code"
                  fill
                  className="object-contain p-2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
} 