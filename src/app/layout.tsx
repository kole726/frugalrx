import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/Header"
import Footer from '@/components/layout/Footer'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FrugalRx - Save Up to 80% on Prescriptions",
  description: "Save money on your prescription medications with FrugalRx. Compare prices, get digital savings cards, and save up to 80% at pharmacies near you.",
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
        <main className="pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
