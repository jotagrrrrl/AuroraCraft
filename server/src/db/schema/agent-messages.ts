import { pgTable, uuid, text, jsonb, pgEnum, timestamp, index } from 'drizzle-orm/pg-core'
import { agentSessions } from './agent-sessions'

export const messageRoleEnum = pgEnum('message_role', ['user', 'agent', 'system'])

export const agentMessages = pgTable('agent_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => agentSessions.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('agent_messages_session_id_idx').on(table.sessionId),
])

export type AgentMessage = typeof agentMessages.$inferSelect
export type NewAgentMessage = typeof agentMessages.$inferInsert
