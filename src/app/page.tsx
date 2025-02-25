"use client"
import { motion, Variants } from "framer-motion"
import Hero from "@/components/home/Hero"
import TrendingSavings from "@/components/home/TrendingSavings"
import PharmacyHighlight from "@/components/home/PharmacyHighlight"
import HowToSave from "@/components/home/HowToSave"
import DownloadCard from "@/components/home/DownloadCard"
import Testimonials from "@/components/home/Testimonials"
import BlogPreview from "@/components/home/BlogPreview"
import Newsletter from "@/components/home/Newsletter"
import FAQ from "@/components/home/FAQ"

export default function Home() {
  const fadeIn: Variants = {
    initial: { 
      opacity: 0, 
      y: 20 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#EFFDF6] to-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div 
            className="absolute inset-0 bg-[url('/images/patterns/dots.svg')] bg-repeat opacity-50" 
            style={{ backgroundSize: '20px 20px' }}
          />
        </div>
        <Hero />
      </section>

      {/* TrendingSavings Section */}
      <section className="relative bg-white">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0 bg-[url('/images/patterns/dots.svg')] bg-repeat rotate-45" style={{ backgroundSize: '20px 20px' }} />
        </div>
        <TrendingSavings />
      </section>

      <PharmacyHighlight />

      {/* HowToSave Section - Removed pattern */}
      <HowToSave />

      <DownloadCard />

      {/* Testimonials Section */}
      <section className="relative bg-white">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0 bg-[url('/images/patterns/dots.svg')] bg-repeat rotate-45" style={{ backgroundSize: '20px 20px' }} />
        </div>
        <Testimonials />
      </section>

      <BlogPreview />

      {/* Newsletter Section */}
      <section className="relative bg-[#F8FAFC]">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0 bg-[url('/images/patterns/dots.svg')] bg-repeat rotate-45" style={{ backgroundSize: '20px 20px' }} />
        </div>
        <Newsletter />
      </section>

      <FAQ />
    </main>
  )
}
