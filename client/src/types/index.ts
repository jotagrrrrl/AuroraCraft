export interface User {
  id: string
  username: string
  email: string
  role: 'user' | 'admin'
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  userId: string
  name: string
  description: string | null
  status: 'active' | 'archived'
  software: string
  language: 'java' | 'kotlin'
  javaVersion: string
  compiler: 'maven' | 'gradle'
  createdAt: string
  updatedAt: string
}

export interface CreateProjectInput {
  name: string
  description?: string
  software?: string
  language?: 'java' | 'kotlin'
  javaVersion?: string
  compiler?: 'maven' | 'gradle'
}

export interface UpdateProjectInput {
  name?: string
  description?: string | null
  status?: 'active' | 'archived'
  software?: string
  language?: 'java' | 'kotlin'
  javaVersion?: string
  compiler?: 'maven' | 'gradle'
}

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface AgentSession {
  id: string
  projectId: string
  status: AgentStatus
  opencodeSessionId?: string | null
  createdAt: string
  updatedAt: string
}

export interface AgentSessionWithMessages extends AgentSession {
  messages: AgentMessage[]
}

export interface AgentMessage {
  id: string
  sessionId: string
  role: 'user' | 'agent' | 'system'
  content: string
  metadata?: MessageMetadata | null
  createdAt: string
}

export interface MessageMetadata {
  parts?: MessagePart[]
}

export type MessagePart =
  | { type: 'thinking'; content: string }
  | { type: 'file'; action: 'create' | 'update' | 'delete' | 'rename'; path: string; newPath?: string }
  | { type: 'todo-list'; items: TodoItem[] }

export interface TodoItem {
  text: string
  status: 'pending' | 'in-progress' | 'completed'
}

export interface AgentLog {
  id: string
  sessionId: string
  logType: string
  message: string
  createdAt: string
}

export interface AdminStats {
  totalUsers: number
  totalProjects: number
  totalAgentSessions: number
}

export interface AdminProject {
  id: string
  name: string
  status: 'active' | 'archived'
  software: string
  language: 'java' | 'kotlin'
  compiler: 'maven' | 'gradle'
  createdAt: string
  updatedAt: string
  ownerUsername: string | null
}

export interface AIModel {
  id: string
  name: string
  provider: string
  description: string
}

export const AI_MODELS: AIModel[] = [
  { id: 'opencode/minimax-m2.5-free', name: 'MiniMax M2.5', provider: 'MiniMax', description: 'High-performance coding model with strong reasoning' },
  { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'Anthropic', description: 'Balanced performance and intelligence' },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI', description: 'Advanced reasoning and code generation' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Multimodal AI with strong coding abilities' },
]

export const DEFAULT_MODEL_ID = AI_MODELS[0].id

export interface ApiError {
  message: string
  statusCode: number
}
