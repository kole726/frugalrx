"use client"
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
  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#EFFDF6] to-white">
        <Hero />
      </section>

      {/* TrendingSavings Section */}
      <section className="relative bg-white">
        <TrendingSavings />
      </section>

      <PharmacyHighlight />
      
      <HowToSave />
      <DownloadCard />

      {/* Testimonials Section */}
      <section className="relative bg-white">
        <Testimonials />
      </section>

      <BlogPreview />

      {/* Newsletter Section */}
      <section className="relative bg-[#F8FAFC]">
        <Newsletter />
      </section>

      <FAQ />
    </main>
  )
}
