import BookingPage from '@/components/booking/BookingPage'

interface BookingPageProps {
  params: Promise<{
    detailerId: string
  }>
}

export default async function Book({ params }: BookingPageProps) {
  const { detailerId } = await params
  return <BookingPage detailerId={detailerId} />
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BookingPageProps) {
  const { detailerId } = await params
  // In a real app, we'd fetch the detailer's business name from the database
  const businessName = detailerId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  return {
    title: `Book ${businessName} - Mobile Auto Detailing`,
    description: `Schedule your mobile auto detailing appointment with ${businessName}. Professional car washing and detailing at your location.`,
  }
}



