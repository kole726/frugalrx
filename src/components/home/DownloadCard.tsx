'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { ArrowDownTrayIcon, DevicePhoneMobileIcon, PrinterIcon } from '@heroicons/react/24/outline'

const features = [
  {
    icon: DevicePhoneMobileIcon,
    title: 'Digital Card',
    description: 'Save the card to your phone for easy access anytime',
  },
  {
    icon: PrinterIcon,
    title: 'Print Card',
    description: 'Print a physical copy to keep in your wallet',
  },
  {
    icon: ArrowDownTrayIcon,
    title: 'Instant Access',
    description: 'No registration required - download and use immediately',
  },
]

export default function DownloadCard() {
  return (
    <section className="py-24 bg-gradient-to-b from-[#EFFDF6] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Card Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <Image
                src="/images/discount-card.png"
                alt="FrugalRx Discount Card"
                width={500}
                height={300}
                className="rounded-lg"
              />
            </div>
            {/* Decorative Elements */}
            <div className="absolute -top-4 -left-4 w-72 h-72 bg-primary/5 rounded-full -z-10 blur-2xl" />
            <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-secondary/5 rounded-full -z-10 blur-2xl" />
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
                Download Your Free Discount Card
              </h2>
              <p className="text-xl text-gray-600">
                Start saving on your prescriptions today with our free pharmacy discount card
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

            {/* Download Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button className="bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-full font-semibold transition-all transform hover:scale-105 flex items-center justify-center">
                <DevicePhoneMobileIcon className="w-5 h-5 mr-2" />
                Download Digital Card
              </button>
              <button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-semibold transition-all transform hover:scale-105 flex items-center justify-center">
                <PrinterIcon className="w-5 h-5 mr-2" />
                Print Card
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
} 