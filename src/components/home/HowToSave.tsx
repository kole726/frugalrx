'use client'
import Image from 'next/image'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'

const steps = [
  {
    id: 1,
    title: 'Get Your Free Card',
    description: 'Download your digital savings card instantly - no registration required.',
    icon: '/images/icons/card-icon.svg',
  },
  {
    id: 2,
    title: 'Find Your Medication',
    description: 'Search for your prescription and compare prices at nearby pharmacies.',
    icon: '/images/icons/search-icon.svg',
  },
  {
    id: 3,
    title: 'Show & Save',
    description: 'Present your card at the pharmacy to receive instant discounts.',
    icon: '/images/icons/savings-icon.svg',
  },
]

export default function HowToSave() {
  const staggerChildren: Variants = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <section className="py-16 md:py-24 bg-white">
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerChildren}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-dark mb-3 md:mb-4">
            How to Save with FrugalRx
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Start saving on your prescriptions in three simple steps
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 mb-10 md:mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step Number */}
              <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-6 h-6 sm:w-8 sm:h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm sm:text-base font-bold">
                {step.id}
              </div>

              {/* Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-light rounded-full flex items-center justify-center mb-4 md:mb-6">
                <Image
                  src={step.icon}
                  alt={step.title}
                  width={36}
                  height={36}
                  className="text-primary w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
                />
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-dark mb-2 md:mb-3">{step.title}</h3>
              <p className="text-sm sm:text-base text-gray-600">{step.description}</p>

              {/* Connector Line (only between steps) */}
              {step.id !== steps.length && (
                <div className="hidden sm:block absolute top-10 sm:top-12 left-[calc(100%_-_12px)] w-full h-0.5 bg-light">
                  <div className="absolute right-0 top-1/2 -mt-1.5 w-3 h-3 border-t-2 border-r-2 border-light transform rotate-45" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 sm:p-8 md:p-12"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="text-white mb-6 sm:mb-0 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Ready to Start Saving?</h3>
              <p className="text-white/90 text-sm sm:text-base">
                Get your free prescription discount card now
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <Link
                href="/download-card"
                className="bg-white text-primary hover:bg-white/90 px-6 py-2.5 rounded-full font-semibold transition-colors text-center text-sm sm:text-base"
              >
                Download Card
              </Link>
              <Link
                href="/how-it-works"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-6 py-2.5 rounded-full font-semibold transition-colors text-center text-sm sm:text-base"
              >
                Learn More
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
} 