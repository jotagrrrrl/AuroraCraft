import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { projects } from '../db/schema/projects.js'
import { agentSessions } from '../db/schema/agent-sessions.js'
import { agentMessages } from '../db/schema/agent-messages.js'
import { agentLogs } from '../db/schema/agent-logs.js'
import { authMiddleware } from '../middleware/auth.js'
import { agentExecutor } from '../agents/executor.js'

const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  model: z.string().max(100).optional(),
})

async function verifyProjectOwnership(userId: string, projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)
  return project
}

export async function agentRoutes(app: FastifyInstance) {
  // List agent sessions for a project
  app.get('/api/projects/:projectId/agent/sessions', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { projectId } = request.params as { projectId: string }

    const project = await verifyProjectOwnership(request.user!.id, projectId)
    if (!project) {
      return reply.status(404).send({ message: 'Project not found', statusCode: 404 })
    }

    const sessions = await db
      .select()
      .from(agentSessions)
      .where(eq(agentSessions.projectId, projectId))
      .orderBy(desc(agentSessions.createdAt))

    return sessions
  })

  // Create a new agent session
  app.post('/api/projects/:projectId/agent/sessions', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { projectId } = request.params as { projectId: string }

    const project = await verifyProjectOwnership(request.user!.id, projectId)
    if (!project) {
      return reply.status(404).send({ message: 'Project not found', statusCode: 404 })
    }

    const [session] = await db
      .insert(agentSessions)
      .values({ projectId })
      .returning()

    return reply.status(201).send(session)
  })

  // Get a specific agent session with its messages
  app.get('/api/projects/:projectId/agent/sessions/:sessionId', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { projectId, sessionId } = request.params as { projectId: string; sessionId: string }

    const project = await verifyProjectOwnership(request.user!.id, projectId)
    if (!project) {
      return reply.status(404).send({ message: 'Project not found', statusCode: 404 })
    }

    const [session] = await db
      .select()
      .from(agentSessions)
      .where(and(eq(agentSessions.id, sessionId), eq(agentSessions.projectId, projectId)))
      .limit(1)

    if (!session) {
      return reply.status(404).send({ message: 'Session not found', statusCode: 404 })
    }

    const messages = await db
      .select()
      .from(agentMessages)
      .where(eq(agentMessages.sessionId, sessionId))
      .orderBy(agentMessages.createdAt)

    return { ...session, messages }
  })

  // Send a message to an agent session
  app.post('/api/projects/:projectId/agent/sessions/:sessionId/messages', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { projectId, sessionId } = request.params as { projectId: string; sessionId: string }
    const parsed = sendMessageSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.issues[0].message,
        statusCode: 400,
      })
    }

    const project = await verifyProjectOwnership(request.user!.id, projectId)
    if (!project) {
      return reply.status(404).send({ message: 'Project not found', statusCode: 404 })
    }

    const [session] = await db
      .select()
      .from(agentSessions)
      .where(and(eq(agentSessions.id, sessionId), eq(agentSessions.projectId, projectId)))
      .limit(1)

    if (!session) {
      return reply.status(404).send({ message: 'Session not found', statusCode: 404 })
    }

    if (session.status === 'running') {
      return reply.status(409).send({ message: 'Agent is already processing', statusCode: 409 })
    }

    // Save the user message
    const [message] = await db
      .insert(agentMessages)
      .values({
        sessionId,
        role: 'user',
        content: parsed.data.content,
      })
      .returning()

    // Fire-and-forget: launch the AI agent executor asynchronously
    agentExecutor.execute(
      {
        sessionId,
        projectId,
        prompt: parsed.data.content,
        bridgeName: 'opencode',
        model: parsed.data.model,
        opencodeSessionId: session.opencodeSessionId ?? undefined,
        projectName: project.name,
        software: project.software,
        language: project.language,
        compiler: project.compiler,
        javaVersion: project.javaVersion,
      },
      {
        onOutput: (content) => { app.log.debug({ sessionId }, `Agent output: ${content.substring(0, 100)}`) },
        onStatus: (status) => { app.log.info({ sessionId, status }, 'Agent status changed') },
        onLog: (logType, msg) => { app.log.debug({ sessionId, logType }, msg) },
        onComplete: () => { app.log.info({ sessionId }, 'Agent execution completed') },
        onError: (error) => { app.log.error({ sessionId, error }, 'Agent execution error') },
      },
    ).catch((err) => {
      app.log.error({ sessionId, err }, 'Unhandled agent execution error')
    })

    return reply.status(201).send(message)
  })

  // Cancel an agent session
  app.post('/api/projects/:projectId/agent/sessions/:sessionId/cancel', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { projectId, sessionId } = request.params as { projectId: string; sessionId: string }

    const project = await verifyProjectOwnership(request.user!.id, projectId)
    if (!project) {
      return reply.status(404).send({ message: 'Project not found', statusCode: 404 })
    }

    const [session] = await db
      .select()
      .from(agentSessions)
      .where(and(eq(agentSessions.id, sessionId), eq(agentSessions.projectId, projectId)))
      .limit(1)

    if (!session) {
      return reply.status(404).send({ message: 'Session not found', statusCode: 404 })
    }

    if (session.status !== 'running' && session.status !== 'idle') {
      return reply.status(400).send({ message: 'Session is not active', statusCode: 400 })
    }

    await agentExecutor.cancel(sessionId)

    const [updated] = await db
      .update(agentSessions)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(agentSessions.id, sessionId))
      .returning()

    await db.insert(agentLogs).values({
      sessionId,
      logType: 'status',
      message: 'Session cancelled by user',
    })

    return updated
  })

  // Get logs for a session
  app.get('/api/projects/:projectId/agent/sessions/:sessionId/logs', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { projectId, sessionId } = request.params as { projectId: string; sessionId: string }

    const project = await verifyProjectOwnership(request.user!.id, projectId)
    if (!project) {
      return reply.status(404).send({ message: 'Project not found', statusCode: 404 })
    }

    const logs = await db
      .select()
      .from(agentLogs)
      .where(eq(agentLogs.sessionId, sessionId))
      .orderBy(agentLogs.createdAt)

    return logs
  })
}
