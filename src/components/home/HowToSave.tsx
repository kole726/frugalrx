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
    <section className="py-24 bg-white">
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
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-dark mb-4">
            How to Save with FrugalRx
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start saving on your prescriptions in three simple steps
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
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
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                {step.id}
              </div>

              {/* Icon */}
              <div className="w-24 h-24 bg-light rounded-full flex items-center justify-center mb-6">
                <Image
                  src={step.icon}
                  alt={step.title}
                  width={48}
                  height={48}
                  className="text-primary"
                />
              </div>

              <h3 className="text-xl font-bold text-dark mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>

              {/* Connector Line (only between steps) */}
              {step.id !== steps.length && (
                <div className="hidden md:block absolute top-12 left-[calc(100%_-_24px)] w-full h-0.5 bg-light">
                  <div className="absolute right-0 top-1/2 -mt-2 w-4 h-4 border-t-2 border-r-2 border-light transform rotate-45" />
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
          className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 md:p-12"
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-white mb-6 md:mb-0">
              <h3 className="text-2xl font-bold text-white mb-2">Ready to Start Saving?</h3>
              <p className="text-white/90">
                Get your free prescription discount card now
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/download-card"
                className="bg-white text-primary hover:bg-white/90 px-6 py-3 rounded-full font-semibold transition-colors"
              >
                Download Card
              </Link>
              <Link
                href="/how-it-works"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-6 py-3 rounded-full font-semibold transition-colors"
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