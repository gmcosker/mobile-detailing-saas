import DashboardLayout from '@/components/layout/DashboardLayout'
import ServicesPage from '@/components/services/ServicesPage'

// Services page with DashboardLayout sidebar
export default function Services() {
  return (
    <DashboardLayout title="Services">
      <ServicesPage />
    </DashboardLayout>
  )
}


