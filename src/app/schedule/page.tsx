import DashboardLayout from '@/components/layout/DashboardLayout'
import SchedulePage from '@/components/schedule/SchedulePage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Schedule - Mobile Detailing Dashboard',
  description: 'Manage your appointment schedule and calendar for your mobile detailing business',
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

export default function SchedulePageRoute() {
  return (
    <DashboardLayout title="Schedule">
      <SchedulePage />
    </DashboardLayout>
  )
}

