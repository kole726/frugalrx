import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'FrugalRx - Medication Savings'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image({ params }: { params: { name: string } }) {
  // Format the drug name to be more readable
  const formattedName = params.name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        <div style={{ color: '#006B52', fontSize: '64px', fontWeight: 'bold', marginBottom: '20px' }}>
          {formattedName}
        </div>
        <div style={{ color: '#333', fontSize: '32px', marginBottom: '40px' }}>
          Save up to 80% on your prescription
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#006B52', fontSize: '48px', fontWeight: 'bold' }}>
            FrugalRx
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
} 