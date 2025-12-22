import { FastifyInstance } from 'fastify'
import * as authController from '../controllers/auth.controller.js'
import { authMiddleware } from '../middlewares/auth.js'

export const authRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
        },
      },
    },
    handler: authController.login,
  })

  fastify.post('/refresh', {
    handler: authController.refresh,
  })

  fastify.post('/logout', {
    handler: authController.logout,
  })

  fastify.post('/logout-all', {
    preHandler: authMiddleware,
    handler: authController.logoutAll,
  })

  fastify.get('/me', {
    preHandler: authMiddleware,
    handler: authController.getMe,
  })

  fastify.post('/forgot-password', {
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
    },
    handler: authController.forgotPassword,
  })

  fastify.get('/validate-reset-token', {
    schema: {
      querystring: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 1 },
        },
      },
    },
    handler: authController.validateResetToken,
  })

  fastify.post('/reset-password', {
    schema: {
      body: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 8 },
        },
      },
    },
    handler: authController.resetPassword,
  })

  fastify.post('/change-password', {
    preHandler: authMiddleware,
    schema: {
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 1 },
          newPassword: { type: 'string', minLength: 8 },
        },
      },
    },
    handler: authController.changePassword,
  })
}