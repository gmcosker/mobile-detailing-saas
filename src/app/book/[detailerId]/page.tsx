import BookingPage from '@/components/booking/BookingPage'

interface BookingPageProps {
  params: Promise<{
    detailerId: string
  }>
}

export default async function Book({ params }: BookingPageProps) {
  const resolvedParams = await params
  const { detailerId } = resolvedParams
  
  // Debug: Log the detailerId to ensure it's being extracted correctly
  console.log('Book page: detailerId from params:', detailerId)
  
  if (!detailerId) {
    console.error('Book page: detailerId is missing from params!', resolvedParams)
    return <div>Error: Detailer ID not found in URL</div>
  }
  
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



