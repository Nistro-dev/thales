import { FastifyRequest, FastifyReply } from 'fastify'
import * as backupService from '../services/backup.service.js'
import { createSuccessResponse, SuccessMessages } from '../utils/response.js'

// GET /api/backup/database - Download database backup (legacy)
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

// GET /api/backup/list - List all backups
export const listBackups = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  const backups = await backupService.listBackups()

  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, backups))
}

// POST /api/backup/create - Create a new full backup
export const createBackup = async (
  request: FastifyRequest<{ Body: { type?: 'full' | 'database' } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.userId
  const type = request.body?.type || 'full'

  let result
  if (type === 'database') {
    result = await backupService.createDatabaseBackup(userId, false)
  } else {
    result = await backupService.createFullBackup(userId, false)
  }

  return reply.status(201).send(createSuccessResponse(SuccessMessages.CREATED, result))
}

// GET /api/backup/:id/download - Get download URL for a backup
export const getBackupDownloadUrl = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params

  const url = await backupService.getBackupDownloadUrl(id)

  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, { url }))
}

// DELETE /api/backup/:id - Delete a backup
export const deleteBackup = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params
  const userId = request.user!.userId

  await backupService.deleteBackup(id, userId)

  return reply.send(createSuccessResponse(SuccessMessages.DELETED, { id }))
}

// POST /api/backup/:id/restore - Restore from a backup
export const restoreBackup = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params
  const userId = request.user!.userId

  await backupService.restoreFromBackup(id, userId)

  return reply.send(createSuccessResponse('Restauration effectuée avec succès', { id }))
}
