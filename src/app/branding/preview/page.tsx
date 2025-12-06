import DashboardLayout from '@/components/layout/DashboardLayout'
import BrandPreview from '@/components/branding/BrandPreview'

export default function BrandPreviewPage() {
  // For now, using a hardcoded detailer ID
  // In a real app, this would come from authentication
  const detailerId = 'premium-auto'

  return (
    <DashboardLayout title="Brand Preview">
      <BrandPreview detailerId={detailerId} />
    </DashboardLayout>
  )
}


