import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { UserDashboard } from '@/components/dashboard/UserDashboard'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()

  return (
    <UserDashboard
      onStartExam={() => void navigate({ to: '/pemeriksaan' })}
      onOpenHistory={() => void navigate({ to: '/riwayat' })}
    />
  )
}
