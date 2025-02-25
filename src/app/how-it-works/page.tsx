"use client"
import Image from "next/image"
import { useState } from "react"
import { CheckCircleIcon } from "@heroicons/react/24/solid"
import FAQ from "@/components/home/FAQ"
import { QrCodeIcon } from "@heroicons/react/24/outline"
import { motion } from "framer-motion"
import ScrollProgress from "@/components/ScrollProgress"

const steps = [
  {
    number: "1",
    title: "Search for your medication",
    description: "Enter your prescription name and see prices at pharmacies near you.",
    image: "/images/how-it-works/search.png",
    icon: "🔍"
  },
  {
    number: "2",
    title: "Get your digital savings card",
    description: "Download your free digital card to your phone's wallet - no registration required.",
    image: "/images/how-it-works/card.png",
    icon: "💳"
  },
  {
    number: "3",
    title: "Save at the pharmacy",
    description: "Show your digital card to the pharmacist to save up to 80% on your prescriptions.",
    image: "/images/how-it-works/pharmacy.png",
    icon: "💊"
  }
]

const benefits = [
  "Free to use - no registration required",
  "Accepted at over 59,000 pharmacies",
  "Save up to 80% on prescription medications",
  "Digital card works instantly",
  "Compare prices at different pharmacies",
  "Use with or without insurance"
]

export default function HowItWorks() {
  const [showQR, setShowQR] = useState(false)

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  }

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <>
      <ScrollProgress />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-[#EFFDF6] to-white py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('/images/patterns/dots.svg')] bg-repeat opacity-50" />
          </div>
          <motion.div 
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative"
            initial="initial"
            animate="animate"
            variants={staggerChildren}
          >
            <motion.div 
              className="text-center max-w-3xl mx-auto"
              variants={fadeIn}
            >
              <h1 className="text-4xl sm:text-5xl font-bold text-dark mb-6">
                How FrugalRx Works
              </h1>
              <p className="text-xl text-gray-600">
                Save up to 80% on prescription medications with our free digital savings card. No registration required.
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* Steps Section */}
        <section className="py-24 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent hidden md:block" />
          <motion.div 
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            <div className="grid md:grid-cols-3 gap-12">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  className="text-center relative"
                  variants={fadeIn}
                >
                  <div className="relative mb-8 transform hover:scale-105 transition-transform">
                    <div className="relative h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-transparent p-8 group">
                      <div className="absolute inset-0 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                        {step.icon}
                      </div>
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-dark mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Benefits Section */}
        <section className="bg-[#F8FAFC] py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[url('/images/patterns/dots.svg')] bg-repeat rotate-45" />
          </div>
          <motion.div 
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-dark mb-4">
                Why Choose FrugalRx?
              </h2>
              <p className="text-xl text-gray-600">
                We make it easy to save money on your prescriptions
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-4 bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <CheckCircleIcon className="w-6 h-6 text-primary flex-shrink-0" />
                  <p className="text-lg text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* FAQ Section - Using our existing FAQ component */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-dark mb-4">
                Common Questions
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to know about saving with FrugalRx
              </p>
            </div>
            <FAQ />
          </div>
        </section>

        {/* CTA Section - Enhanced with QR code */}
        <section className="bg-primary text-white py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('/images/patterns/dots.svg')] bg-repeat opacity-50" />
          </div>
          <motion.div 
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative"
            initial="initial"
            animate="animate"
            variants={staggerChildren}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Start Saving?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Get your free digital savings card now
            </p>
            <div className="relative inline-block">
              <button 
                className="bg-white text-primary hover:bg-gray-100 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2"
                onMouseEnter={() => setShowQR(true)}
                onMouseLeave={() => setShowQR(false)}
              >
                <QrCodeIcon className="w-5 h-5" />
                Download Digital Card
              </button>
              {showQR && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-white rounded-lg shadow-xl p-4 w-64">
                  <div className="relative aspect-square">
                    <Image
                      src="/images/qr/FrugalRx-QR-Code.svg"
                      alt="FrugalRx QR Code"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-gray-600 text-sm mt-2">
                    Scan to get your digital card
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </section>
      </main>
    </>
  )
} 