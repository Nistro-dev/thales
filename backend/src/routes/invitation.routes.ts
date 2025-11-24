import { FastifyInstance } from 'fastify'
import * as invitationController from '../controllers/invitation.controller.js'
import { authMiddleware } from '../middlewares/auth.js'

export const invitationRoutes = async (fastify: FastifyInstance) => {
  // Routes publiques (pour l'invité)
  fastify.get('/validate', {
    schema: {
      querystring: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 1 },
        },
      },
    },
    handler: invitationController.validateToken,
  })

  fastify.post('/complete', {
    schema: {
      body: {
        type: 'object',
        required: ['token', 'firstName', 'lastName', 'password', 'gdprConsent'],
        properties: {
          token: { type: 'string', minLength: 1 },
          firstName: { type: 'string', minLength: 1, maxLength: 50 },
          lastName: { type: 'string', minLength: 1, maxLength: 50 },
          password: { type: 'string', minLength: 8 },
          gdprConsent: { type: 'boolean', const: true },
        },
      },
    },
    handler: invitationController.completeRegistration,
  })

  // Routes admin (protégées)
  fastify.post('/', {
    preHandler: authMiddleware,
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
    },
    handler: invitationController.createInvitation,
  })

  fastify.get('/pending', {
    preHandler: authMiddleware,
    handler: invitationController.listPending,
  })

  fastify.delete('/:id', {
    preHandler: authMiddleware,
    handler: invitationController.cancel,
  })
}
