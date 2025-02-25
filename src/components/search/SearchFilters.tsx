interface Props {
  filters: {
    radius: number
    sortBy: string
    chainOnly: boolean
  }
  onChange: (filters: any) => void
}

export default function SearchFilters({ filters, onChange }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Search Radius
          </label>
          <select
            value={filters.radius}
            onChange={(e) => onChange({ ...filters, radius: Number(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value={5}>5 miles</option>
            <option value={10}>10 miles</option>
            <option value={25}>25 miles</option>
            <option value={50}>50 miles</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="price">Lowest Price</option>
            <option value="distance">Distance</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="chainOnly"
            checked={filters.chainOnly}
            onChange={(e) => onChange({ ...filters, chainOnly: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="chainOnly" className="ml-2 block text-sm text-gray-700">
            Show chain pharmacies only
          </label>
        </div>
      </div>
    </div>
  )
} 