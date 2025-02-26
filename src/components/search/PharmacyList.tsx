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
      return a.price - b.price
    }
    return parseFloat(a.distance) - parseFloat(b.distance)
  })

  const filteredPharmacies = chainOnly 
    ? sortedPharmacies.filter(p => p.name.includes('CVS') || p.name.includes('Walgreens') || p.name.includes('Walmart'))
    : sortedPharmacies

  return (
    <div className="space-y-4">
      {filteredPharmacies.map((item, index) => (
        <div 
          key={`${item.name}-${index}`}
          className="bg-white rounded-lg shadow-md p-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {item.distance} miles away
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(item.price)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 