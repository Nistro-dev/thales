import { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.routes.js'
import { invitationRoutes } from './invitation.routes.js'
import { fileRoutes } from './file.routes.js'
import userRoutes from './user.routes.js'
import roleRoutes from './role.routes.js'

export const registerRoutes = async (fastify: FastifyInstance): Promise<void> => {
  await fastify.register(authRoutes, { prefix: '/api/auth' })
  await fastify.register(invitationRoutes, { prefix: '/api/invitations' })
  await fastify.register(fileRoutes, { prefix: '/api/files' })
  await fastify.register(userRoutes, { prefix: '/api/users' })
  await fastify.register(roleRoutes, { prefix: '/api/roles' })
}
