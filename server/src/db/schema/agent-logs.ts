import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core'
import { agentSessions } from './agent-sessions'

export const agentLogs = pgTable('agent_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => agentSessions.id, { onDelete: 'cascade' }),
  logType: varchar('log_type', { length: 32 }).notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('agent_logs_session_id_idx').on(table.sessionId),
])

export type AgentLog = typeof agentLogs.$inferSelect
export type NewAgentLog = typeof agentLogs.$inferInsert
