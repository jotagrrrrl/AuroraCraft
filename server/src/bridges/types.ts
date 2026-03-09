export interface BridgeTask {
  sessionId: string
  projectId: string
  prompt: string
  context?: {
    opencodeSessionId?: string
    model?: string
    projectName?: string
    software?: string
    language?: string
    compiler?: string
    javaVersion?: string
  }
}

export interface BridgeStreamEvent {
  type: 'output' | 'error' | 'status' | 'complete' | 'thinking' | 'file-op' | 'todo'
  content: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export type MessagePart =
  | { type: 'thinking'; content: string }
  | { type: 'file'; action: 'create' | 'update' | 'delete' | 'rename'; path: string; newPath?: string }
  | { type: 'todo-list'; items: TodoItem[] }

export interface TodoItem {
  text: string
  status: 'pending' | 'in-progress' | 'completed'
}

export interface BridgeResult {
  success: boolean
  output: string
  files?: Array<{ path: string; content: string }>
  error?: string
  metadata?: {
    opencodeSessionId?: string
    parts?: MessagePart[]
  }
}

export interface BridgeInterface {
  name: string
  initialize(): Promise<void>
  executeTask(task: BridgeTask): Promise<BridgeResult>
  streamResponse(task: BridgeTask, onEvent: (event: BridgeStreamEvent) => void): Promise<BridgeResult>
  cancelExecution(sessionId: string): Promise<void>
  isAvailable(): boolean
}
