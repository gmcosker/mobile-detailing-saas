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
}



