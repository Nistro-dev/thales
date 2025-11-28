import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import { env } from './config/env.js'
import { logger } from './utils/logger.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { registerRoutes } from './routes/index.js'

const fastify = Fastify({
  logger: false,
})

const start = async (): Promise<void> => {
  try {
    await fastify.register(cors, {
      origin: (origin, cb) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) {
          cb(null, true)
          return
        }

        const allowedOrigins = [
          env.FRONTEND_URL,
          'http://localhost:5173',
          'http://localhost:3000',
        ]

        // In development, also allow devtunnels
        if (env.NODE_ENV !== 'production') {
          // Allow VS Code dev tunnels
          if (origin.includes('.devtunnels.ms')) {
            cb(null, true)
            return
          }
        }

        if (allowedOrigins.includes(origin)) {
          cb(null, true)
        } else {
          logger.warn(`CORS blocked origin: ${origin}`)
          cb(new Error('Not allowed by CORS'), false)
        }
      },
      credentials: true,
    })

    await fastify.register(helmet, {
      contentSecurityPolicy: env.NODE_ENV === 'production',
    })

    await fastify.register(cookie, {
      secret: env.JWT_ACCESS_SECRET,
      hook: 'onRequest',
      parseOptions: {
        httpOnly: true,
        // In dev with tunnels, we need secure=true and sameSite='none'
        // In production, we use secure=true and sameSite='strict'
        secure: env.NODE_ENV === 'production' || process.env.USE_TUNNELS === 'true',
        sameSite: process.env.USE_TUNNELS === 'true' ? 'none' : 'strict',
      },
    })

    await fastify.register(multipart, {
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
    })

    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
      keyGenerator: (request) => {
        return request.ip
      },
      allowList: (request) => {
        return request.url === '/health'
      },
    })

    fastify.setErrorHandler(errorHandler)

    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() }
    })

    await registerRoutes(fastify)

    await fastify.listen({ port: env.PORT, host: '0.0.0.0' })

    logger.info(`Server running on port ${env.PORT}`)
    logger.info(`Environment: ${env.NODE_ENV}`)
  } catch (error) {
    logger.error(error, 'Failed to start server')
    process.exit(1)
  }
}

const shutdown = async (): Promise<void> => {
  logger.info('Shutting down server...')
  await fastify.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

start()