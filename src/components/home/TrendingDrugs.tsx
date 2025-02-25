interface TrendingDrug {
  name: string;
  genericName: string;
  currentPrice: number;
  originalPrice: number;
  savings: number;
  pharmacies: string[];
}

const trendingDrugs: TrendingDrug[] = [
  {
    name: "Metformin",
    genericName: "Metformin HCL",
    currentPrice: 14.99,
    originalPrice: 84.99,
    savings: 82,
    pharmacies: ["CVS", "Walgreens", "Walmart"]
  },
  {
    name: "Lisinopril",
    genericName: "Lisinopril",
    currentPrice: 8.99,
    originalPrice: 45.99,
    savings: 80,
    pharmacies: ["Walmart", "Rite Aid", "CVS"]
  },
  {
    name: "Amoxicillin",
    genericName: "Amoxicillin",
    currentPrice: 7.99,
    originalPrice: 32.99,
    savings: 76,
    pharmacies: ["Walgreens", "CVS", "Walmart"]
  }
]

export default function TrendingDrugs() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Trending Savings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {trendingDrugs.map((drug) => (
            <div 
              key={drug.name}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{drug.name}</h3>
                    <p className="text-gray-600">{drug.genericName}</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Save {drug.savings}%
                  </span>
                </div>

                <div className="flex items-baseline mb-4">
                  <span className="text-2xl font-bold text-[#006B52]">${drug.currentPrice}</span>
                  <span className="ml-2 text-gray-500 line-through">${drug.originalPrice}</span>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Available at:</p>
                  <div className="flex flex-wrap gap-2">
                    {drug.pharmacies.map((pharmacy) => (
                      <span 
                        key={pharmacy}
                        className="px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                      >
                        {pharmacy}
                      </span>
                    ))}
                  </div>
                </div>

                <a 
                  href={`/drug/${encodeURIComponent(drug.name)}`}
                  className="mt-4 block w-full bg-[#FF1B75] text-white px-4 py-2 rounded-full font-semibold hover:bg-[#FF1B75]/90 transition-colors text-center"
                >
                  Get Discount
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 