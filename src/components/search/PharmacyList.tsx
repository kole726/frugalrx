import { PharmacyPrice } from '@/types/api'
import { formatCurrency } from '@/utils/format'

interface Props {
  pharmacies: PharmacyPrice[]
  sortBy: string
  chainOnly: boolean
}

export default function PharmacyList({ pharmacies, sortBy, chainOnly }: Props) {
  const sortedPharmacies = [...pharmacies].sort((a, b) => {
    if (sortBy === 'price') {
      return a.price.price - b.price.price
    }
    return a.pharmacy.distance - b.pharmacy.distance
  })

  const filteredPharmacies = chainOnly 
    ? sortedPharmacies.filter(p => p.pharmacy.chainCode)
    : sortedPharmacies

  return (
    <div className="space-y-4">
      {filteredPharmacies.map((item, index) => (
        <div 
          key={`${item.pharmacy.npi}-${index}`}
          className="bg-white rounded-lg shadow-md p-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{item.pharmacy.name}</h3>
              <p className="text-gray-600">{item.pharmacy.streetAddress}</p>
              <p className="text-gray-600">
                {item.pharmacy.city}, {item.pharmacy.state} {item.pharmacy.zipCode}
              </p>
              <p className="text-gray-600">{item.pharmacy.phone}</p>
              <p className="text-sm text-gray-500 mt-1">
                {item.pharmacy.distance.toFixed(1)} miles away
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(item.price.price)}
              </div>
              {item.price.ucPrice > item.price.price && (
                <div className="text-sm text-gray-500 line-through">
                  Regular price: {formatCurrency(item.price.ucPrice)}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 