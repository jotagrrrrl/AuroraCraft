import { Users, FolderKanban, Cpu, Loader2 } from 'lucide-react'
import { useAdminStats } from '@/hooks/use-admin'

export default function AdminOverviewPage() {
  const { stats, isLoading } = useAdminStats()

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-text">Overview</h1>
      <p className="mt-1 text-sm text-text-muted">System status and key metrics</p>

      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-surface p-5">
              <div className="h-4 w-24 rounded bg-border" />
              <div className="mt-3 h-8 w-16 rounded bg-border" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-muted">Total Users</p>
              <Users className="h-4 w-4 text-text-dim" />
            </div>
            <p className="mt-2 text-2xl font-bold text-text">{stats.totalUsers}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-muted">Total Projects</p>
              <FolderKanban className="h-4 w-4 text-text-dim" />
            </div>
            <p className="mt-2 text-2xl font-bold text-text">{stats.totalProjects}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-muted">Agent Sessions</p>
              <Cpu className="h-4 w-4 text-text-dim" />
            </div>
            <p className="mt-2 text-2xl font-bold text-text">{stats.totalAgentSessions}</p>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-text-dim" />
        </div>
      )}
    </div>
  )
}
