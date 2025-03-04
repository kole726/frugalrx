import { Toaster } from 'react-hot-toast'

export default function TestApiDetailsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <Toaster position="top-right" />
      {children}
    </div>
  )
} 