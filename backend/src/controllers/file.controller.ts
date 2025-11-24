import { FastifyRequest, FastifyReply } from 'fastify'
import { fileService } from '../services/index.js'
import { fileParamsSchema } from '../schemas/index.js'
import { createSuccessResponse, SuccessMessages, ErrorMessages } from '../utils/response.js'

export const upload = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const data = await request.file()

  if (!data) {
    throw {
      statusCode: 400,
      message: ErrorMessages.MISSING_FIELD,
      code: 'VALIDATION_ERROR',
      details: { file: 'Aucun fichier fourni' },
    }
  }

  const buffer = await data.toBuffer()
  const result = await fileService.upload(
    request.user.userId,
    data.filename,
    data.mimetype,
    buffer
  )

  reply.status(201).send(
    createSuccessResponse(SuccessMessages.FILE_UPLOADED, {
      file: result,
    })
  )
}

export const list = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const files = await fileService.list(request.user.userId)

  reply.send(
    createSuccessResponse(SuccessMessages.FILES_RETRIEVED, {
      files,
    })
  )
}

export const download = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const params = fileParamsSchema.parse(request.params)
  const url = await fileService.getDownloadUrl(request.user.userId, params.id)

  reply.send(
    createSuccessResponse(SuccessMessages.RETRIEVED, {
      url,
    })
  )
}

export const remove = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const params = fileParamsSchema.parse(request.params)
  await fileService.remove(request.user.userId, params.id)

  reply.send(
    createSuccessResponse(SuccessMessages.FILE_DELETED, {})
  )
}
