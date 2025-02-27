"use client"
import { Fragment, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Image from 'next/image'

interface PharmacyPrice {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  distance?: string;
  price?: number;
  latitude?: number;
  longitude?: number;
  open24H?: boolean;
  driveUpWindow?: boolean;
  handicapAccess?: boolean;
}

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  drugName: string;
  pharmacy: PharmacyPrice;
  price?: string;
}

export default function CouponModal({ isOpen, onClose, drugName, pharmacy, price }: CouponModalProps) {
  const cancelButtonRef = useRef(null);
  
  // Format the pharmacy address
  const formattedAddress = [
    pharmacy.address,
    pharmacy.city && pharmacy.state ? `${pharmacy.city}, ${pharmacy.state}` : '',
    pharmacy.zipCode
  ].filter(Boolean).join(' ');
  
  // Format the phone number
  const formatPhoneNumber = (phone?: string) => {
    if (!phone || phone.length !== 10) return phone;
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  };
  
  // Generate a random coupon code
  const couponCode = `FRUGAL-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  
  // Handle print coupon
  const handlePrintCoupon = () => {
    window.print();
  };
  
  // Handle text coupon
  const handleTextCoupon = () => {
    // In a real app, this would send a text message with the coupon
    alert('Text message feature would be implemented here');
  };
  
  // Handle email coupon
  const handleEmailCoupon = () => {
    // In a real app, this would send an email with the coupon
    alert('Email feature would be implemented here');
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" initialFocus={cancelButtonRef} onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                        Your Free Coupon
                      </Dialog.Title>
                      
                      {/* Coupon Card */}
                      <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                        {/* Coupon Header */}
                        <div className="bg-[#006142] text-white p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="text-lg font-bold">FrugalRx</h4>
                              <p className="text-sm">Prescription Savings Card</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">BIN: 610020</p>
                              <p className="text-sm">PCN: ACN</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Coupon Body */}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h5 className="font-semibold">{drugName}</h5>
                              <p className="text-sm text-gray-600">at {pharmacy.name}</p>
                              <p className="text-sm text-gray-600">{formattedAddress}</p>
                              {pharmacy.phone && (
                                <p className="text-sm text-gray-600">{formatPhoneNumber(pharmacy.phone)}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Your Price</p>
                              <p className="text-2xl font-bold text-[#006142]">${price || (pharmacy.price?.toFixed(2) || '0.00')}</p>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 pt-4 mb-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm text-gray-600">Coupon Code</p>
                                <p className="font-mono font-semibold">{couponCode}</p>
                              </div>
                              <div className="bg-gray-100 p-2 rounded">
                                {/* This would be a real QR code in production */}
                                <div className="w-16 h-16 bg-gray-300 flex items-center justify-center">
                                  <span className="text-xs text-gray-600">QR Code</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-500 mt-2">
                            Present this coupon to the pharmacist when filling your prescription. 
                            This coupon is not insurance. Savings may vary.
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          className="flex flex-col items-center justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                          onClick={handlePrintCoupon}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                          </svg>
                          Print
                        </button>
                        <button
                          type="button"
                          className="flex flex-col items-center justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                          onClick={handleTextCoupon}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          Text
                        </button>
                        <button
                          type="button"
                          className="flex flex-col items-center justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                          onClick={handleEmailCoupon}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          Email
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-[#006142] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#22A307] sm:ml-3 sm:w-auto"
                    onClick={onClose}
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                    ref={cancelButtonRef}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 