import { FastifyRequest, FastifyReply } from 'fastify'
import * as backupService from '../services/backup.service.js'

// GET /api/backup/database
export const downloadDatabaseBackup = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = request.user!.userId

  const backup = await backupService.generateDatabaseBackup(userId)

  // Set headers for file download
  reply.header('Content-Type', 'application/sql')
  reply.header('Content-Disposition', `attachment; filename="${backup.filename}"`)

  return reply.send(backup.content)
}
