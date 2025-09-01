import DashboardLayout from '@/components/layout/DashboardLayout'
import CustomersPage from '@/components/customers/CustomersPage'

export default function CustomersPageRoute() {
  return (
    <DashboardLayout title="Customers">
      <CustomersPage />
    </DashboardLayout>
  )
}
