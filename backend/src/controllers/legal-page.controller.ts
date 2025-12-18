import { FastifyRequest, FastifyReply } from 'fastify'
import { LegalPageType } from '@prisma/client'
import * as legalPageService from '../services/legal-page.service.js'
import { createSuccessResponse } from '../utils/response.js'

interface TypeParams {
  type: LegalPageType
}

interface UpsertBody {
  title: string
  content: string
  version?: string
}

// GET /api/legal/:type (public)
export const getLegalPage = async (
  request: FastifyRequest<{ Params: TypeParams }>,
  reply: FastifyReply
) => {
  const { type } = request.params

  let page = await legalPageService.getLegalPage(type)

  // Return default content if page doesn't exist yet
  if (!page) {
    const defaults = legalPageService.getDefaultContent(type)
    return reply.send(
      createSuccessResponse('Page légale récupérée', {
        type,
        title: defaults.title,
        content: defaults.content,
        version: '1.0',
        isDefault: true,
      })
    )
  }

  return reply.send(createSuccessResponse('Page légale récupérée', { ...page, isDefault: false }))
}

// GET /api/admin/legal (admin)
export const getAllLegalPages = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  const pages = await legalPageService.getAllLegalPages()

  // Add default pages if they don't exist
  const pageTypes: LegalPageType[] = ['TERMS', 'PRIVACY', 'LEGAL_NOTICE']
  const existingTypes = pages.map((p) => p.type)

  const result = [...pages]

  for (const type of pageTypes) {
    if (!existingTypes.includes(type)) {
      const defaults = legalPageService.getDefaultContent(type)
      result.push({
        id: '',
        type,
        title: defaults.title,
        content: defaults.content,
        version: '1.0',
        updatedBy: null,
        editor: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as typeof pages[0])
    }
  }

  // Sort by type
  result.sort((a, b) => a.type.localeCompare(b.type))

  return reply.send(createSuccessResponse('Pages légales récupérées', { pages: result }))
}

// PUT /api/admin/legal/:type (admin)
export const upsertLegalPage = async (
  request: FastifyRequest<{ Params: TypeParams; Body: UpsertBody }>,
  reply: FastifyReply
) => {
  const { type } = request.params
  const { title, content, version } = request.body
  const userId = request.user!.userId

  const page = await legalPageService.upsertLegalPage({
    type,
    title,
    content,
    version,
    updatedBy: userId,
  })

  return reply.send(createSuccessResponse('Page légale mise à jour', page))
}
