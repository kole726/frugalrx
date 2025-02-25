"use client"
import Image from "next/image"
import Link from "next/link"
import Navigation from "./Navigation"

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/logo/Frugal-Rx-Logo-800w.png"
              alt="FrugalRx Logo"
              width={180}
              height={40}
              priority
              className="w-auto h-8"
            />
          </Link>

          {/* Navigation - moved to right */}
          <Navigation />
        </div>
      </div>
    </header>
  )
} 