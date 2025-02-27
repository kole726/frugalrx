import PharmacyLocator from "@/components/home/PharmacyLocator"

export const metadata = {
  title: 'Find Pharmacies Near You | FrugalRx',
  description: 'Search for pharmacies near you that accept FrugalRx discount cards. Enter your ZIP code to find the closest participating pharmacies.',
}

export default function PharmaciesPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#2C3E50] mb-4">
          Find Participating Pharmacies
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Enter your ZIP code to find pharmacies near you that accept FrugalRx
        </p>
      </div>
      
      <PharmacyLocator />
      
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-[#2C3E50] mb-4">
          About Our Pharmacy Network
        </h2>
        <p className="text-gray-500 max-w-3xl mx-auto mb-6">
          FrugalRx is accepted at over 59,000 pharmacies nationwide, including major chains and independent drugstores. 
          Our network includes CVS, Walgreens, Walmart, Kroger, Rite Aid, and many more.
        </p>
        <p className="text-gray-500 max-w-3xl mx-auto">
          Simply present your FrugalRx card or app at the pharmacy counter when filling your prescription to receive your discount.
        </p>
      </div>
    </main>
  )
} 