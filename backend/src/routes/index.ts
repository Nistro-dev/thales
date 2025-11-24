import { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.routes.js'
import { invitationRoutes } from './invitation.routes.js'
import userRoutes from './user.routes.js'
import roleRoutes from './role.routes.js'
import { sectionRoutes, subSectionRoutes } from './section.routes.js'
import { productRoutes } from './product.routes.js'
import {
  reservationRoutes,
  reservationAdminRoutes,
  availabilityRoutes,
} from './reservation.routes.js'
import { qrRoutes, scanRoutes } from './qr.routes.js'
import { movementRoutes } from './movement.routes.js'
import { fileRoutes } from './file.routes.js'

export const registerRoutes = async (fastify: FastifyInstance) => {
  await fastify.register(authRoutes, { prefix: '/api/auth' })
  await fastify.register(invitationRoutes, { prefix: '/api/invitations' })
  await fastify.register(userRoutes, { prefix: '/api/users' })
  await fastify.register(roleRoutes, { prefix: '/api/roles' })
  await fastify.register(sectionRoutes, { prefix: '/api/sections' })
  await fastify.register(subSectionRoutes, { prefix: '/api/subsections' })
  await fastify.register(productRoutes, { prefix: '/api/products' })
  await fastify.register(availabilityRoutes, { prefix: '/api/products' })
  await fastify.register(reservationRoutes, { prefix: '/api/reservations' })
  await fastify.register(reservationAdminRoutes, { prefix: '/api/admin/reservations' })
  await fastify.register(qrRoutes, { prefix: '/api' })
  await fastify.register(scanRoutes, { prefix: '/api' })
  await fastify.register(movementRoutes, { prefix: '/api' })
  await fastify.register(fileRoutes, { prefix: '/api/files' })
}
