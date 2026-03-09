import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Project, CreateProjectInput, UpdateProjectInput } from '@/types'

export function useProjects() {
  const queryClient = useQueryClient()

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/projects'),
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateProjectInput) =>
      api.post<Project>('/projects', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: UpdateProjectInput & { id: string }) =>
      api.patch<Project>(`/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  return {
    projects: projects ?? [],
    isLoading,
    createProject: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    updateProject: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    deleteProject: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  }
}

export function useProject(id: string) {
  const { data: project, isLoading } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => api.get<Project>(`/projects/${id}`),
    enabled: !!id,
  })

  return {
    project: project ?? null,
    isLoading,
  }
}
