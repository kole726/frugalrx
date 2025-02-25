import type { Metadata } from "next"
import { Lato } from "next/font/google"
import "./globals.css"
import Header from "@/components/Header"
import Footer from '@/components/layout/Footer'

const lato = Lato({ 
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
})

export const metadata: Metadata = {
  title: "FrugalRx - Save on Prescription Medications",
  description: "Save up to 80% on prescription medications with FrugalRx's free discount card.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={lato.className}>
        <Header />
        <main className="pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
