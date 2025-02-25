interface DrugInfoProps {
  info: {
    brandName: string;
    genericName: string;
    gsn: number;
    ndcCode: number;
    strength?: string;
    form?: string;
    packageSize?: string;
    manufacturer?: string;
    description?: string;
    usage?: string;
    sideEffects?: string[];
    warnings?: string[];
    interactions?: string[];
    storage?: string;
    prices?: {
      price: number;
      pharmacy: string;
      distance: number;
    }[];
  }
}

export default function DrugInfo({ info }: DrugInfoProps) {
  return (
    <div className="space-y-6">
      {/* Basic Info Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="space-y-2">
            {info.brandName && (
              <div>
                <span className="text-gray-600 font-medium">Brand Name: </span>
                <span className="text-gray-900">{info.brandName}</span>
              </div>
            )}
            <div>
              <span className="text-gray-600 font-medium">Generic Name: </span>
              <span className="text-gray-900">{info.genericName}</span>
            </div>
          </div>
        </div>

        {/* Drug Details Section */}
        <div className="p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Drug Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {info.strength && (
              <div>
                <span className="text-gray-600 font-medium">Strength: </span>
                <span className="text-gray-900">{info.strength}</span>
              </div>
            )}
            {info.form && (
              <div>
                <span className="text-gray-600 font-medium">Form: </span>
                <span className="text-gray-900">{info.form}</span>
              </div>
            )}
            {info.packageSize && (
              <div>
                <span className="text-gray-600 font-medium">Package Size: </span>
                <span className="text-gray-900">{info.packageSize}</span>
              </div>
            )}
            {info.manufacturer && (
              <div>
                <span className="text-gray-600 font-medium">Manufacturer: </span>
                <span className="text-gray-900">{info.manufacturer}</span>
              </div>
            )}
          </div>
        </div>

        {/* Savings Card Section */}
        <div className="p-6 bg-gradient-to-r from-[#006B52] to-[#008562] text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Save on {info.brandName || info.genericName}</h3>
              <p className="text-white/90">Download our free prescription savings card to get the best price</p>
            </div>
            <button 
              className="bg-white text-[#006B52] px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
              onClick={() => window.location.href = '/download-card'}
            >
              Get Card
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      {info.prices && info.prices.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Local Pharmacy Prices</h3>
          <div className="space-y-4">
            {info.prices.map((price, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{price.pharmacy}</h4>
                  <p className="text-sm text-gray-500">{price.distance.toFixed(1)} miles away</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#006B52]">${price.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">with card</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medical Information */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h3>
        
        {info.description && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Description</h4>
            <p className="text-gray-700">{info.description}</p>
          </div>
        )}

        {info.usage && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">How to Use</h4>
            <p className="text-gray-700">{info.usage}</p>
          </div>
        )}

        {info.sideEffects && info.sideEffects.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Side Effects</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {info.sideEffects.map((effect, index) => (
                <li key={index}>{effect}</li>
              ))}
            </ul>
          </div>
        )}

        {info.warnings && info.warnings.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Warnings</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {info.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {info.storage && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Storage</h4>
            <p className="text-gray-700">{info.storage}</p>
          </div>
        )}

        <div className="text-sm text-gray-500 mt-6 p-4 bg-gray-50 rounded-lg">
          <p>This information is for educational purposes only and is not medical advice. 
             Always consult your healthcare provider for medical guidance.</p>
        </div>
      </div>
    </div>
  )
}

// Loading skeleton for the drug info component
export function DrugInfoSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
      <div className="p-6 border-b border-gray-200">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
      <div className="p-6 bg-gray-50">
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-5/6"></div>
          ))}
        </div>
      </div>
      <div className="p-6 bg-[#006B52]">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-5 bg-white/20 rounded w-2/3"></div>
            <div className="h-4 bg-white/20 rounded w-3/4"></div>
          </div>
          <div className="h-10 w-24 bg-white/20 rounded-full"></div>
        </div>
      </div>
    </div>
  )
} 