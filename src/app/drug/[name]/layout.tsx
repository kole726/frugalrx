import { Metadata, ResolvingMetadata } from 'next'

type Props = {
  params: { name: string }
  children: React.ReactNode
}

export async function generateMetadata(
  { params }: { params: { name: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Format the drug name to be more readable
  const formattedName = params.name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return {
    title: `${formattedName} | FrugalRx`,
    description: `Save up to 80% on ${formattedName} with FrugalRx. Compare prices at pharmacies near you and get digital savings cards.`,
    openGraph: {
      title: `${formattedName} | FrugalRx`,
      description: `Save up to 80% on ${formattedName} with FrugalRx. Compare prices at pharmacies near you and get digital savings cards.`,
      url: `https://frugalrx.com/drug/${params.name}`,
      siteName: 'FrugalRx',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${formattedName} | FrugalRx`,
      description: `Save up to 80% on ${formattedName} with FrugalRx. Compare prices at pharmacies near you and get digital savings cards.`,
    }
  }
}

export default function DrugLayout({ children, params }: Props) {
  return (
    <>
      {children}
    </>
  )
} 