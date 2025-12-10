import BookingPage from '@/components/booking/BookingPage'
import MobilePhoneFrame from '@/components/booking/MobilePhoneFrame'

interface MobileBookingPageProps {
  params: Promise<{
    detailerId: string
  }>
}

export default async function MobileBook({ params }: MobileBookingPageProps) {
  const resolvedParams = await params
  const { detailerId } = resolvedParams
  
  if (!detailerId) {
    return <div>Error: Detailer ID not found in URL</div>
  }
  
  return (
    <MobilePhoneFrame>
      <BookingPage detailerId={detailerId} />
    </MobilePhoneFrame>
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: MobileBookingPageProps) {
  const { detailerId } = await params
  const businessName = detailerId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  return {
    title: `Mobile Demo - Book ${businessName}`,
    description: `Mobile booking demo for ${businessName}.`,
  }
}

