// src/routes/qr.routes.ts

import { FastifyInstance } from 'fastify'
import * as qrController from '../controllers/qr.controller.js'
import * as scanController from '../controllers/scan.controller.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requirePermission } from '../middlewares/permission.js'
import { PERMISSIONS } from '../constants/permissions.js'

export const qrRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', authMiddleware)

  // Lookup product by QR code
  fastify.get('/products/qr/:qrCode', {
    preHandler: requirePermission(PERMISSIONS.VIEW_PRODUCTS),
    handler: qrController.getProductByQR,
  })

  // Regenerate QR code
  fastify.post('/products/:id/regenerate-qr', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: qrController.regenerateQR,
  })
}

export const scanRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', authMiddleware)

  // Scan product - get info
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
