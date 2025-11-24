// src/routes/section.routes.ts

import { FastifyInstance } from 'fastify'
import * as sectionController from '../controllers/section.controller.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requirePermission } from '../middlewares/permission.js'
import { PERMISSIONS } from '../constants/permissions.js'

export const sectionRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', authMiddleware)

  // Sections
  fastify.get('/', { handler: sectionController.list })
  fastify.get('/:id', { handler: sectionController.getById })

  fastify.post('/', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_SECTIONS),
    handler: sectionController.create,
  })

  fastify.patch('/:id', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_SECTIONS),
    handler: sectionController.update,
  })

  fastify.delete('/:id', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_SECTIONS),
    handler: sectionController.remove,
  })

  // SubSections
  fastify.post('/:id/subsections', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_SECTIONS),
    handler: sectionController.createSubSection,
  })
}

export const subSectionRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', authMiddleware)

  fastify.get('/orphans', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_SECTIONS),
    handler: sectionController.listOrphanSubSections,
  })

  fastify.get('/:id', { handler: sectionController.getSubSectionById })

  fastify.patch('/:id', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_SECTIONS),
    handler: sectionController.updateSubSection,
  })

  fastify.delete('/:id', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_SECTIONS),
    handler: sectionController.removeSubSection,
  })
}
