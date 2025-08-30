import DashboardLayout from '@/components/layout/DashboardLayout'
import PhotosPage from '@/components/photos/PhotosPage'
import { SafeSupabaseWrapper } from '@/components/safe-supabase-wrapper'

export default function Photos() {
  return (
    <DashboardLayout title="Photos">
      <SafeSupabaseWrapper>
        <PhotosPage />
      </SafeSupabaseWrapper>
    </DashboardLayout>
  )
}

export const metadata = {
  title: 'Photos - Mobile Detailing Dashboard',
  description: 'Manage before and after photos for your mobile detailing appointments',
}

