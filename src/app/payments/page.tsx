import DashboardLayout from '@/components/layout/DashboardLayout'
import PaymentsPage from '@/components/payments/PaymentsPage'

export default function Payments() {
  return (
    <DashboardLayout title="Payments">
      <PaymentsPage />
    </DashboardLayout>
  )
}

export const metadata = {
  title: 'Payments - Mobile Detailing Dashboard',
  description: 'Manage payments, invoices, and earnings for your mobile detailing business',
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



