import DashboardLayout from '@/components/layout/DashboardLayout'
import BrandingSettings from '@/components/branding/BrandingSettings'

export default function BrandingPage() {
  // For now, using a hardcoded detailer ID
  // In a real app, this would come from authentication
  const detailerId = 'premium-auto'

  return (
    <DashboardLayout title="Brand Settings">
      <BrandingSettings detailerId={detailerId} />
    </DashboardLayout>
  )
}


