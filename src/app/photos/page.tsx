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
  icons: {
    icon: [
      { url: "/icons/android/android-launchericon-192-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/android/android-launchericon-512-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/ios/152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/ios/180.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/ios/167.png", sizes: "167x167", type: "image/png" },
    ],
  },
}

