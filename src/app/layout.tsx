import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/layout/Header"
import Footer from '@/components/layout/Footer'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FrugalRx - Save Up to 80% on Prescriptions",
  description: "Save money on your prescription medications with FrugalRx. Compare prices, get digital savings cards, and save up to 80% at pharmacies near you.",
  icons: {
    icon: '/images/logo/RX-Favicon.png',
    apple: '/images/logo/RX-Favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
