import DashboardLayout from '@/components/layout/DashboardLayout'
import SchedulePage from '@/components/schedule/SchedulePage'

export default function SchedulePageRoute() {
  return (
    <DashboardLayout title="Schedule">
      <SchedulePage />
    </DashboardLayout>
  )
}

