'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/logo/Frugal-Rx-Logo-800w.png"
              alt="FrugalRx Logo"
              width={160}
              height={48}
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/how-it-works" className="text-dark hover:text-primary transition-colors">
              How it Works
            </Link>
            <Link href="/find-rx-savings" className="text-dark hover:text-primary transition-colors">
              Find Rx Savings
            </Link>
            <Link href="/pharmacies" className="text-dark hover:text-primary transition-colors">
              Find Pharmacies
            </Link>
          </nav>

          {/* Download Card Button with Dropdown - Desktop */}
          <div className="hidden md:block relative group">
            <Link
              href="/download-card"
              className="bg-accent hover:bg-accent/90 text-white px-6 py-2 rounded-full font-semibold transition-colors"
            >
              Download Card
            </Link>
            
            {/* Dropdown Content */}
            <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-1 z-50">
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
                  <div className="relative w-full max-w-[250px] mx-auto bg-white rounded-lg p-4">
                    <Image
                      src="/images/qr/FrugalRx-QR-Code.svg"
                      alt="FrugalRx QR Code"
                      width={200}
                      height={200}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="sr-only">Open menu</span>
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/how-it-works"
                className="block px-3 py-2 text-dark hover:bg-light rounded-md"
              >
                How it Works
              </Link>
              <Link
                href="/find-rx-savings"
                className="block px-3 py-2 text-dark hover:bg-light rounded-md"
              >
                Find Rx Savings
              </Link>
              <Link
                href="/pharmacies"
                className="block px-3 py-2 text-dark hover:bg-light rounded-md"
              >
                Find Pharmacies
              </Link>
              <Link
                href="/download-card"
                className="block px-3 py-2 bg-accent text-white rounded-md text-center mt-4"
              >
                Download Card
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 