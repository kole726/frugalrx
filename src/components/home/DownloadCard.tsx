'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { DevicePhoneMobileIcon, QrCodeIcon } from '@heroicons/react/24/outline'

const features = [
  {
    icon: DevicePhoneMobileIcon,
    title: 'Digital Wallet Card',
    description: 'Save the card to your phone\'s wallet for easy access anytime',
  },
  {
    icon: QrCodeIcon,
    title: 'Instant Access',
    description: 'Scan QR code with your phone camera - no app download required',
  },
]

export default function DownloadCard() {
  const [showQR, setShowQR] = useState(false)

  return (
    <section className="py-24 bg-gradient-to-b from-[#EFFDF6] to-white relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Phone Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="max-w-[300px] mx-auto bg-white rounded-2xl shadow-2xl p-4 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              {/* Phone mockup with wallet card */}
              <div className="relative aspect-[9/19.5] bg-gray-900 rounded-[2rem] p-2 shadow-xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[12px] bg-gray-900 rounded-b-[1rem]" />
                <div className="relative h-full w-full bg-white rounded-[1.8rem] overflow-hidden">
                  {/* Wallet Card Preview */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <p className="text-gray-400 text-sm">Wallet Card Preview</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Adjusted decorative elements size */}
            <div className="absolute -top-4 -left-4 w-48 h-48 bg-primary/5 rounded-full -z-10 blur-2xl" />
            <div className="absolute -bottom-4 -right-4 w-48 h-48 bg-secondary/5 rounded-full -z-10 blur-2xl" />
          </motion.div>

          {/* Right Column - Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-dark mb-4">
                Get Your Digital Savings Card
              </h2>
              <p className="text-xl text-gray-600">
                Add your FrugalRx card to your phone's digital wallet for instant savings at the pharmacy
              </p>
            </motion.div>

            {/* Features */}
            <div className="grid gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start space-x-4"
                >
                  <feature.icon className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-dark">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Download Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <div className="relative inline-block group">
                <button 
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2"
                  onMouseEnter={() => setShowQR(true)}
                  onMouseLeave={() => setShowQR(false)}
                >
                  <QrCodeIcon className="w-5 h-5" />
                  Get Digital Card
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-white rounded-lg shadow-xl p-4 w-64 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative aspect-square">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_URL || ''}/images/qr/FrugalRx-QR-Code.svg`}
                      alt="FrugalRx Digital Card QR Code"
                      fill
                      className="object-contain"
                      priority
                      onError={(e) => {
                        console.error('Failed to load QR code image');
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="text-gray-600 text-sm mt-2">
                    Scan to get your digital card
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
} 