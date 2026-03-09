import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AdminStats, AdminProject, User } from '@/types'

export function useAdminStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get<AdminStats>('/admin/stats'),
  })

  return { stats: data ?? null, isLoading }
}

export function useAdminUsers() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<User[]>('/admin/users'),
  })

  return { users: data ?? [], isLoading }
}

export function useAdminProjects() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'projects'],
    queryFn: () => api.get<AdminProject[]>('/admin/projects'),
  })

  return { projects: data ?? [], isLoading }
}
