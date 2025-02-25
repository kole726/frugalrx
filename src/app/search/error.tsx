'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-dark mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-8">We apologize for the inconvenience.</p>
        <button
          onClick={() => reset()}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  )
} 