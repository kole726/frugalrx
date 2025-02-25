import Hero from '@/components/home/Hero'
import TrendingSavings from '@/components/home/TrendingSavings'
import PharmacyHighlight from '@/components/home/PharmacyHighlight'
import HowToSave from '@/components/home/HowToSave'

export default function Home() {
  return (
    <main>
      <Hero />
      <TrendingSavings />
      <PharmacyHighlight />
      <HowToSave />
      {/* We'll add other sections here later */}
    </main>
  )
}
