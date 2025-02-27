'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

interface CouponModalProps {
  isOpen: boolean
  onClose: () => void
  drugName?: string
  pharmacy?: any
  price?: string
}

export default function CouponModal({ isOpen, onClose, drugName, pharmacy, price }: CouponModalProps) {
  const [showQR, setShowQR] = useState(false)
  
  // Close modal when escape key is pressed
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])
  
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Header */}
        <div className="bg-[#006142] p-6 rounded-t-lg">
          <h2 className="text-xl font-bold text-white">Your Free Coupon</h2>
          <p className="text-[#EFFDF6] mt-1">
            {drugName} {pharmacy ? `at ${pharmacy.name}` : ''}
            {price ? ` - $${price}` : ''}
          </p>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {showQR ? (
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-inner border border-gray-200 mx-auto max-w-[200px] mb-4">
                <div className="relative w-full aspect-square">
                  <Image
                    src="/images/qr/FrugalRx-QR-Code.svg"
                    alt="Coupon QR Code"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code at the pharmacy to redeem your discount
              </p>
              <button 
                onClick={() => setShowQR(false)}
                className="text-[#006142] font-medium hover:text-[#22A307]"
              >
                Back to coupon
              </button>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800">FrugalRx</h3>
                    <p className="text-sm text-gray-600">Prescription Savings Card</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">BIN: 610020</p>
                    <p className="text-sm text-gray-600">PCN: ACN</p>
                  </div>
                </div>
                <div className="border-t border-gray-300 pt-4">
                  <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Member ID:</span> FRUGAL12345</p>
                  <p className="text-sm text-gray-600"><span className="font-medium">Group:</span> FRGRX</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">How to use this coupon:</h3>
                  <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                    <li>Show this coupon to your pharmacist</li>
                    <li>The pharmacy will process the coupon like insurance</li>
                    <li>You pay the discounted price - no insurance needed!</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Medication:</h3>
                  <p className="text-sm text-gray-600">{drugName}</p>
                </div>
                
                {pharmacy && (
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">Pharmacy:</h3>
                    <p className="text-sm text-gray-600">{pharmacy.name}</p>
                  </div>
                )}
                
                {price && (
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">Price with coupon:</h3>
                    <p className="text-xl font-bold text-[#006142]">${price}</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={() => window.print()}
                  className="w-full py-2 px-4 bg-[#006142] text-white rounded-md hover:bg-[#22A307] transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                  </svg>
                  Print Coupon
                </button>
                
                <button 
                  onClick={() => setShowQR(true)}
                  className="w-full py-2 px-4 bg-white border border-[#006142] text-[#006142] rounded-md hover:bg-[#EFFDF6] transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  Show QR Code
                </button>
                
                <button 
                  onClick={() => {
                    // In a real app, this would send the coupon via SMS
                    alert('SMS feature would be implemented here')
                  }}
                  className="w-full py-2 px-4 bg-white border border-[#006142] text-[#006142] rounded-md hover:bg-[#EFFDF6] transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Text to Phone
                </button>
                
                <button 
                  onClick={() => {
                    // In a real app, this would email the coupon
                    alert('Email feature would be implemented here')
                  }}
                  className="w-full py-2 px-4 bg-white border border-[#006142] text-[#006142] rounded-md hover:bg-[#EFFDF6] transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Email Coupon
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 