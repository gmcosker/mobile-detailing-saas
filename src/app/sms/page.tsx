import DashboardLayout from '@/components/layout/DashboardLayout'
import SMSPage from '@/components/sms/SMSPage'

export default function SMS() {
  return (
    <DashboardLayout title="SMS & Reminders">
      <SMSPage />
    </DashboardLayout>
  )
}

export const metadata = {
  title: 'SMS & Reminders - Mobile Detailing Dashboard',
  description: 'Manage SMS reminders, notifications, and customer communication for your mobile detailing business',
}


