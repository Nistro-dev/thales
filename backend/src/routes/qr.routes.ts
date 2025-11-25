// src/routes/qr.routes.ts

import { FastifyInstance } from 'fastify'
import * as scanController from '../controllers/scan.controller.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requirePermission } from '../middlewares/permission.js'
import { PERMISSIONS } from '../constants/permissions.js'

export const scanRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', authMiddleware)

  // Scan reservation QR code - get info
  fastify.get('/scan/:qrCode', {
    preHandler: requirePermission(PERMISSIONS.VIEW_RESERVATIONS),
    handler: scanController.scanProduct,
  })

  // Scan checkout
  fastify.post('/scan/:qrCode/checkout', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_RESERVATIONS),
    handler: scanController.scanCheckout,
  })

  // Scan return
  fastify.post('/scan/:qrCode/return', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_RESERVATIONS),
    handler: scanController.scanReturn,
  })
}
