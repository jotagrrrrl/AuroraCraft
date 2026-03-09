import type { FastifyInstance } from 'fastify'
import { sql, eq, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema/users.js'
import { projects } from '../db/schema/projects.js'
import { agentSessions } from '../db/schema/agent-sessions.js'
import { authMiddleware, adminGuard } from '../middleware/auth.js'

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware)
  app.addHook('preHandler', adminGuard)

  // Admin stats
  app.get('/api/admin/stats', async () => {
    const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users)
    const [projectCount] = await db.select({ count: sql<number>`count(*)::int` }).from(projects)
    const [sessionCount] = await db.select({ count: sql<number>`count(*)::int` }).from(agentSessions)

    return {
      totalUsers: userCount.count,
      totalProjects: projectCount.count,
      totalAgentSessions: sessionCount.count,
    }
  })

  // List all users (admin view)
  app.get('/api/admin/users', async () => {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))

    return allUsers
  })

  // List all projects with owner info (admin view)
  app.get('/api/admin/projects', async () => {
    const allProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        software: projects.software,
        language: projects.language,
        compiler: projects.compiler,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        ownerUsername: users.username,
      })
      .from(projects)
      .leftJoin(users, eq(projects.userId, users.id))
      .orderBy(desc(projects.createdAt))

    return allProjects
  })
}
