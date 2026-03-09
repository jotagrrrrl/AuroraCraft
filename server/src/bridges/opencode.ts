import type { BridgeInterface, BridgeTask, BridgeResult, BridgeStreamEvent, MessagePart, TodoItem } from './types.js'
import { env } from '../env.js'

export class OpenCodeBridge implements BridgeInterface {
  name = 'opencode'
  private baseUrl: string
  private activeSessions = new Map<string, AbortController>()
  private available = false
  private lastAvailabilityCheck = 0

  constructor() {
    this.baseUrl = env.OPENCODE_URL
  }

  async initialize(): Promise<void> {
    await this.checkAvailability()
  }

  private async checkAvailability(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/session`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      })
      this.available = res.ok
    } catch {
      this.available = false
    }
    this.lastAvailabilityCheck = Date.now()
    return this.available
  }

  isAvailable(): boolean {
    // Re-check every 30 seconds
    if (Date.now() - this.lastAvailabilityCheck > 30000) {
      this.checkAvailability()
    }
    return this.available
  }

  async executeTask(task: BridgeTask): Promise<BridgeResult> {
    return this.streamResponse(task, () => {})
  }

  async streamResponse(task: BridgeTask, onEvent: (event: BridgeStreamEvent) => void): Promise<BridgeResult> {
    const controller = new AbortController()
    this.activeSessions.set(task.sessionId, controller)

    try {
      // Re-check availability before each execution
      const reachable = await this.checkAvailability()
      if (!reachable) {
        return {
          success: false,
          output: '',
          error: `OpenCode server is not reachable at ${this.baseUrl}. Make sure OpenCode is running with: opencode serve`,
        }
      }

      onEvent({
        type: 'status',
        content: 'Connecting to OpenCode...',
        timestamp: new Date().toISOString(),
      })

      // Create or reuse OpenCode session
      const opencodeSessionId = await this.resolveOpenCodeSession(task)

      onEvent({
        type: 'status',
        content: 'Sending prompt to AI agent...',
        timestamp: new Date().toISOString(),
      })

      // Build the prompt with project context
      const contextPrompt = this.buildContextPrompt(task)

      // Send the chat message to OpenCode — this blocks until the agent finishes
      const chatResponse = await fetch(`${this.baseUrl}/session/${opencodeSessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: contextPrompt }),
        signal: controller.signal,
      })

      if (!chatResponse.ok) {
        const errText = await chatResponse.text().catch(() => 'Unknown error')
        return {
          success: false,
          output: '',
          error: `OpenCode returned status ${chatResponse.status}: ${errText}`,
        }
      }

      onEvent({
        type: 'status',
        content: 'AI agent completed. Processing response...',
        timestamp: new Date().toISOString(),
      })

      // Fetch messages from the OpenCode session to get the full response
      const messagesRes = await fetch(`${this.baseUrl}/session/${opencodeSessionId}/message`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      })

      let textOutput = ''
      const parts: MessagePart[] = []

      if (messagesRes.ok) {
        const messages = await messagesRes.json() as OpenCodeMessage[]
        // Get the latest assistant message(s) since our prompt
        const assistantMessages = messages.filter((m) => m.role === 'assistant')
        const lastAssistant = assistantMessages[assistantMessages.length - 1]

        if (lastAssistant) {
          const parsed = this.parseOpenCodeMessage(lastAssistant)
          textOutput = parsed.text
          parts.push(...parsed.parts)

          // Emit events for each part
          for (const part of parsed.parts) {
            if (part.type === 'thinking') {
              onEvent({ type: 'thinking', content: part.content, timestamp: new Date().toISOString() })
            } else if (part.type === 'file') {
              onEvent({
                type: 'file-op',
                content: `${part.action}: ${part.path}`,
                timestamp: new Date().toISOString(),
                metadata: { action: part.action, path: part.path, newPath: part.newPath },
              })
            } else if (part.type === 'todo-list') {
              onEvent({
                type: 'todo',
                content: JSON.stringify(part.items),
                timestamp: new Date().toISOString(),
              })
            }
          }
        }
      }

      // If we didn't get text from messages, try to use the chat response body
      if (!textOutput) {
        try {
          const chatBody = await chatResponse.json() as Record<string, unknown>
          if (typeof chatBody === 'object' && chatBody !== null) {
            if (typeof chatBody.text === 'string') textOutput = chatBody.text
            else if (typeof chatBody.content === 'string') textOutput = chatBody.content
            else if (typeof chatBody.output === 'string') textOutput = chatBody.output
            else textOutput = JSON.stringify(chatBody)
          }
        } catch {
          // Chat response might have already been consumed or be non-JSON
          textOutput = 'Agent completed the task.'
        }
      }

      onEvent({ type: 'complete', content: 'Done', timestamp: new Date().toISOString() })

      return {
        success: true,
        output: textOutput,
        metadata: {
          opencodeSessionId,
          parts: parts.length > 0 ? parts : undefined,
        },
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, output: '', error: 'Execution cancelled' }
      }
      const msg = err instanceof Error ? err.message : 'Unknown error'
      return { success: false, output: '', error: `OpenCode bridge error: ${msg}` }
    } finally {
      this.activeSessions.delete(task.sessionId)
    }
  }

  async cancelExecution(sessionId: string): Promise<void> {
    const controller = this.activeSessions.get(sessionId)
    if (controller) {
      controller.abort()
      this.activeSessions.delete(sessionId)
    }
  }

  private async resolveOpenCodeSession(task: BridgeTask): Promise<string> {
    const existingId = task.context?.opencodeSessionId

    // Try to reuse existing OpenCode session
    if (existingId) {
      try {
        const res = await fetch(`${this.baseUrl}/session/${existingId}`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        })
        if (res.ok) return existingId
      } catch {
        // Session doesn't exist anymore, create a new one
      }
    }

    // Create a new OpenCode session with model if specified
    const sessionBody: Record<string, string> = {}
    if (task.context?.model) {
      sessionBody.model = task.context.model
    }

    const res = await fetch(`${this.baseUrl}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionBody),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      throw new Error(`Failed to create OpenCode session: status ${res.status}`)
    }

    const session = await res.json() as { id: string }
    return session.id
  }

  private buildContextPrompt(task: BridgeTask): string {
    const ctx = task.context
    if (!ctx?.projectName) return task.prompt

    const lines: string[] = []
    lines.push(`[AuroraCraft Project Context]`)
    lines.push(`Project: ${ctx.projectName}`)
    if (ctx.software) lines.push(`Server Software: ${ctx.software}`)
    if (ctx.language) lines.push(`Language: ${ctx.language}`)
    if (ctx.compiler) lines.push(`Build Tool: ${ctx.compiler}`)
    if (ctx.javaVersion) lines.push(`Java Version: ${ctx.javaVersion}`)
    lines.push('')
    lines.push('RESTRICTIONS:')
    lines.push('- Do NOT execute build commands (mvn, gradle, javac, make)')
    lines.push('- Do NOT execute destructive or long-running terminal commands')
    lines.push('- You may only use terminal for file/folder finding and essential read operations')
    lines.push('- Focus on writing clean, well-structured Minecraft plugin code')
    lines.push('')
    lines.push(`User Request: ${task.prompt}`)

    return lines.join('\n')
  }

  private parseOpenCodeMessage(message: OpenCodeMessage): { text: string; parts: MessagePart[] } {
    const parts: MessagePart[] = []
    const textChunks: string[] = []

    // If message has parts array, parse each part
    if (Array.isArray(message.parts)) {
      for (const part of message.parts) {
        const partType = part.type ?? ''

        // Text content
        if (partType === 'text' || partType === 'text-delta' || partType === 'text-start') {
          const text = part.content ?? part.text ?? ''
          if (text) textChunks.push(text)
        }

        // Thinking / reasoning
        else if (partType === 'reasoning' || partType === 'reasoning-delta' || partType === 'thinking') {
          const content = part.content ?? part.text ?? ''
          if (content) parts.push({ type: 'thinking', content })
        }

        // Tool calls — file operations
        else if (partType === 'tool-call' || partType === 'tool_call' || partType === 'tool-invocation') {
          const toolName = (part.tool ?? part.name ?? part.toolName ?? '').toLowerCase()
          const args = part.args ?? part.arguments ?? part.input ?? {}

          if (toolName === 'write' || toolName === 'file_write' || toolName === 'create') {
            const filePath = args.path ?? args.file_path ?? args.filename ?? ''
            if (filePath) parts.push({ type: 'file', action: 'create', path: String(filePath) })
          } else if (toolName === 'edit' || toolName === 'file_edit' || toolName === 'str_replace' || toolName === 'patch') {
            const filePath = args.path ?? args.file_path ?? args.filename ?? ''
            if (filePath) parts.push({ type: 'file', action: 'update', path: String(filePath) })
          } else if (toolName === 'delete' || toolName === 'file_delete' || toolName === 'remove') {
            const filePath = args.path ?? args.file_path ?? args.filename ?? ''
            if (filePath) parts.push({ type: 'file', action: 'delete', path: String(filePath) })
          } else if (toolName === 'rename' || toolName === 'move' || toolName === 'file_rename') {
            const oldPath = args.path ?? args.old_path ?? args.source ?? ''
            const newPath = args.new_path ?? args.destination ?? args.target ?? ''
            if (oldPath) parts.push({ type: 'file', action: 'rename', path: String(oldPath), newPath: String(newPath) })
          }
          // Skip bash/shell commands — not shown in UI per requirements
        }

        // Todo items
        else if (partType === 'todo' || partType === 'todo-list' || partType === 'plan') {
          const items = this.parseTodoItems(part)
          if (items.length > 0) parts.push({ type: 'todo-list', items })
        }
      }
    }

    // If no parts found, use message content directly
    if (textChunks.length === 0) {
      const fallback = message.content ?? ''
      if (fallback) textChunks.push(fallback)
    }

    return { text: textChunks.join(''), parts }
  }

  private parseTodoItems(part: OpenCodePart): TodoItem[] {
    const items: TodoItem[] = []

    // Try 'items' array in the part
    const rawItems = part.items ?? part.todos ?? part.tasks ?? []
    if (Array.isArray(rawItems)) {
      for (const item of rawItems) {
        if (typeof item === 'string') {
          items.push({ text: item, status: 'pending' })
        } else if (typeof item === 'object' && item !== null) {
          const text = item.text ?? item.title ?? item.description ?? String(item)
          const status = item.status === 'completed' || item.done === true
            ? 'completed'
            : item.status === 'in-progress' || item.status === 'running'
              ? 'in-progress'
              : 'pending'
          items.push({ text: String(text), status })
        }
      }
    }

    // Try parsing content as a todo list (markdown checkbox format)
    const content = part.content ?? part.text ?? ''
    if (typeof content === 'string' && items.length === 0) {
      const lines = content.split('\n')
      for (const line of lines) {
        const checkMatch = line.match(/^[-*]\s*\[([ xX✓])\]\s*(.+)/)
        if (checkMatch) {
          const done = checkMatch[1] !== ' '
          items.push({ text: checkMatch[2].trim(), status: done ? 'completed' : 'pending' })
        }
      }
    }

    return items
  }
}

// Types for parsing OpenCode responses (flexible to handle various shapes)
interface OpenCodePart {
  type?: string
  content?: string
  text?: string
  tool?: string
  name?: string
  toolName?: string
  args?: Record<string, unknown>
  arguments?: Record<string, unknown>
  input?: Record<string, unknown>
  items?: Array<Record<string, unknown>>
  todos?: Array<Record<string, unknown>>
  tasks?: Array<Record<string, unknown>>
  done?: boolean
  status?: string
  [key: string]: unknown
}

interface OpenCodeMessage {
  id?: string
  sessionId?: string
  role?: string
  content?: string
  parts?: OpenCodePart[]
  [key: string]: unknown
}
