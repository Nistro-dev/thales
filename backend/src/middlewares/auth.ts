import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken } from '../utils/jwt.js'
import { logger } from '../utils/logger.js'
import { prisma } from '../utils/prisma.js'

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      userId: string
      email: string
    }
  }
}

export const authMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const token = request.cookies.accessToken

    if (!token) {
      return reply.status(401).send({ error: 'Authentication required' })
    }

    const payload = verifyAccessToken(token)

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, status: true },
    })

    if (!user) {
      return reply.status(401).send({ error: 'User not found' })
    }

    if (user.status === 'DISABLED') {
      return reply.status(403).send({ error: 'Account has been disabled' })
    }

    if (user.status === 'SUSPENDED') {
      return reply.status(403).send({ error: 'Account has been suspended' })
    }

    request.user = {
      userId: payload.userId,
      email: payload.email,
    }
  } catch (error) {
    logger.warn({ error }, 'Invalid access token')
    return reply.status(401).send({ error: 'Invalid or expired token' })
  }
}