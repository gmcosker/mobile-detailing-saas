import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHome from '@/components/dashboard/DashboardHome'

export default function Home() {
  return (
    <DashboardLayout title="Dashboard">
      <DashboardHome />
    </DashboardLayout>
  )
}