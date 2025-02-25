import Hero from '@/components/home/Hero'
import TrendingSavings from '@/components/home/TrendingSavings'
import PharmacyHighlight from '@/components/home/PharmacyHighlight'
import HowToSave from '@/components/home/HowToSave'
import DownloadCard from '@/components/home/DownloadCard'
import Testimonials from '@/components/home/Testimonials'
import BlogPreview from '@/components/home/BlogPreview'
import Newsletter from '@/components/home/Newsletter'
import FAQ from '@/components/home/FAQ'

export default function Home() {
  return (
    <main>
      <Hero />
      <TrendingSavings />
      <PharmacyHighlight />
      <HowToSave />
      <DownloadCard />
      <Testimonials />
      <BlogPreview />
      <Newsletter />
      <FAQ />
      {/* We'll add other sections here later */}
    </main>
  )
}
