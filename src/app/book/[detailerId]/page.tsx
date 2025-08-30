import BookingPage from '@/components/booking/BookingPage'

interface BookingPageProps {
  params: {
    detailerId: string
  }
}

export default function Book({ params }: BookingPageProps) {
  return <BookingPage detailerId={params.detailerId} />
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BookingPageProps) {
  // In a real app, we'd fetch the detailer's business name from the database
  const businessName = params.detailerId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  return {
    title: `Book ${businessName} - Mobile Auto Detailing`,
    description: `Schedule your mobile auto detailing appointment with ${businessName}. Professional car washing and detailing at your location.`,
  }
}

