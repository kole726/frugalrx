import Image from 'next/image'

const pharmacies = [
  { name: 'CVS', logo: '/images/pharmacies/cvs.svg' },
  { name: 'Walgreens', logo: '/images/pharmacies/walgreens.svg' },
  { name: 'Walmart', logo: '/images/pharmacies/walmart.svg' },
  { name: 'Rite Aid', logo: '/images/pharmacies/riteaid.svg' },
  { name: 'Kroger', logo: '/images/pharmacies/kroger.svg' },
  { name: 'Costco', logo: '/images/pharmacies/costco.svg' },
]

export default function PharmacyHighlight() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-light/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-dark mb-4">
            Accepted at Over 59,000 Pharmacies
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Use your FrugalRx card at major pharmacy chains and independent drugstores nationwide
          </p>
        </div>

        {/* Pharmacy Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {pharmacies.map((pharmacy) => (
            <div
              key={pharmacy.name}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="relative w-32 h-16 grayscale hover:grayscale-0 transition-all duration-300">
                <Image
                  src={pharmacy.logo}
                  alt={`${pharmacy.name} logo`}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Map Preview */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8 text-center">
            <h3 className="text-2xl font-bold text-dark mb-4">
              Find Participating Pharmacies Near You
            </h3>
            <p className="text-gray-600 mb-6">
              Enter your location to find the closest pharmacies that accept FrugalRx
            </p>
            
            <div className="flex max-w-md mx-auto">
              <input
                type="text"
                placeholder="Enter ZIP code"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-r-lg font-semibold transition-colors">
                Search
              </button>
            </div>
          </div>

          {/* Map Preview Image - We'll replace this with an actual map later */}
          <div className="relative h-64 bg-gray-100">
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              Map Preview Coming Soon
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Don't see your pharmacy? 
            <button className="text-primary hover:text-primary/80 font-semibold ml-2">
              View full list of participating pharmacies
            </button>
          </p>
        </div>
      </div>
    </section>
  )
} 