import { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.routes.js'
import { invitationRoutes } from './invitation.routes.js'
import { fileRoutes } from './file.routes.js'

export const registerRoutes = async (fastify: FastifyInstance): Promise<void> => {
  await fastify.register(authRoutes, { prefix: '/api/auth' })
    await fastify.register(invitationRoutes, { prefix: '/api/invitations' })
  await fastify.register(fileRoutes, { prefix: '/api/files' })
}
