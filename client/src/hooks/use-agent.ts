import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AgentSession, AgentSessionWithMessages, AgentMessage, AgentLog } from '@/types'

export function useAgentSessions(projectId: string) {
  const queryClient = useQueryClient()

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'agent', 'sessions'],
    queryFn: () => api.get<AgentSession[]>(`/projects/${projectId}/agent/sessions`),
    enabled: !!projectId,
  })

  const createSessionMutation = useMutation({
    mutationFn: () =>
      api.post<AgentSession>(`/projects/${projectId}/agent/sessions`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'agent', 'sessions'] })
    },
  })

  const cancelSessionMutation = useMutation({
    mutationFn: (sessionId: string) =>
      api.post<AgentSession>(`/projects/${projectId}/agent/sessions/${sessionId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'agent', 'sessions'] })
    },
  })

  return {
    sessions: sessions ?? [],
    isLoading,
    createSession: createSessionMutation.mutateAsync,
    isCreatingSession: createSessionMutation.isPending,
    cancelSession: cancelSessionMutation.mutateAsync,
    isCancellingSession: cancelSessionMutation.isPending,
  }
}

export function useAgentSession(projectId: string, sessionId: string) {
  const queryClient = useQueryClient()

  const { data: session, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'agent', 'sessions', sessionId],
    queryFn: () => api.get<AgentSessionWithMessages>(`/projects/${projectId}/agent/sessions/${sessionId}`),
    enabled: !!projectId && !!sessionId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data && (data.status === 'running' || data.status === 'idle')) {
        return 2000
      }
      return false
    },
  })

  const sendMessageMutation = useMutation({
    mutationFn: ({ content, model }: { content: string; model?: string }) =>
      api.post<AgentMessage>(`/projects/${projectId}/agent/sessions/${sessionId}/messages`, { content, model }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'agent', 'sessions', sessionId] })
    },
  })

  return {
    session: session ?? null,
    messages: session?.messages ?? [],
    isLoading,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    sendError: sendMessageMutation.error,
  }
}

export function useAgentLogs(projectId: string, sessionId: string) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'agent', 'sessions', sessionId, 'logs'],
    queryFn: () => api.get<AgentLog[]>(`/projects/${projectId}/agent/sessions/${sessionId}/logs`),
    enabled: !!projectId && !!sessionId,
    refetchInterval: 3000,
  })

  return {
    logs: logs ?? [],
    isLoading,
  }
}
