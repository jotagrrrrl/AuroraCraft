import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { projects } from '../db/schema/projects.js'
import { authMiddleware } from '../middleware/auth.js'

const createProjectSchema = z.object({
  name: z.string().min(2).max(128),
  description: z.string().max(1000).optional(),
  software: z.string().max(32).default('paper'),
  language: z.enum(['java', 'kotlin']).default('java'),
  javaVersion: z.string().max(8).default('21'),
  compiler: z.enum(['maven', 'gradle']).default('gradle'),
})

const updateProjectSchema = z.object({
  name: z.string().min(2).max(128).optional(),
  description: z.string().max(1000).nullable().optional(),
  status: z.enum(['active', 'archived']).optional(),
  software: z.string().max(32).optional(),
  language: z.enum(['java', 'kotlin']).optional(),
  javaVersion: z.string().max(8).optional(),
  compiler: z.enum(['maven', 'gradle']).optional(),
})

export async function projectRoutes(app: FastifyInstance) {
  // List projects for current user
  app.get('/api/projects', { preHandler: [authMiddleware] }, async (request) => {
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, request.user!.id))
      .orderBy(desc(projects.updatedAt))

    return userProjects
  })

  // Get single project
  app.get('/api/projects/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, request.user!.id)))
      .limit(1)

    if (!project) {
      return reply.status(404).send({ message: 'Project not found', statusCode: 404 })
    }

    return project
  })

  // Create project
  app.post('/api/projects', { preHandler: [authMiddleware] }, async (request, reply) => {
    const parsed = createProjectSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.issues[0].message,
        statusCode: 400,
      })
    }

    const [project] = await db
      .insert(projects)
      .values({
        userId: request.user!.id,
        ...parsed.data,
      })
      .returning()

    return reply.status(201).send(project)
  })

  // Update project
  app.patch('/api/projects/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateProjectSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.issues[0].message,
        statusCode: 400,
      })
    }

    const [existing] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, request.user!.id)))
      .limit(1)

    if (!existing) {
      return reply.status(404).send({ message: 'Project not found', statusCode: 404 })
    }

    const [updated] = await db
      .update(projects)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning()

    return updated
  })

  // Delete project
  app.delete('/api/projects/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const [existing] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, request.user!.id)))
      .limit(1)

    if (!existing) {
      return reply.status(404).send({ message: 'Project not found', statusCode: 404 })
    }

    await db.delete(projects).where(eq(projects.id, id))

    return reply.status(204).send()
  })
}
