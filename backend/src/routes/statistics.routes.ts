// src/routes/statistics.routes.ts

import { FastifyInstance } from 'fastify'
import * as statisticsController from '../controllers/statistics.controller.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requirePermission } from '../middlewares/permission.js'
import { PERMISSIONS } from '../constants/permissions.js'

export const statisticsRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', authMiddleware)

  // Realtime stats (cache: 30s)
  fastify.get('/admin/stats/realtime', {
    preHandler: requirePermission(PERMISSIONS.VIEW_STATISTICS),
    handler: statisticsController.getRealtimeStats,
  })

  // Alerts (cache: 60s)
  fastify.get('/admin/stats/alerts', {
    preHandler: requirePermission(PERMISSIONS.VIEW_STATISTICS),
    handler: statisticsController.getAlerts,
  })

  // Dashboard stats (cache: 5min)
  fastify.get('/admin/stats/dashboard', {
    preHandler: requirePermission(PERMISSIONS.VIEW_STATISTICS),
    handler: statisticsController.getDashboardStats,
  })

  // Top products (cache: 5min)
  fastify.get('/admin/stats/top-products', {
    preHandler: requirePermission(PERMISSIONS.VIEW_STATISTICS),
    handler: statisticsController.getTopProducts,
  })

  // Top users (cache: 5min)
  fastify.get('/admin/stats/top-users', {
    preHandler: requirePermission(PERMISSIONS.VIEW_STATISTICS),
    handler: statisticsController.getTopUsers,
  })

  // Sections stats (cache: 5min)
  fastify.get('/admin/stats/sections', {
    preHandler: requirePermission(PERMISSIONS.VIEW_STATISTICS),
    handler: statisticsController.getSectionsStats,
  })

  // Export stats CSV (cache: 10min)
  fastify.get('/admin/stats/export', {
    preHandler: requirePermission(PERMISSIONS.VIEW_STATISTICS),
    handler: statisticsController.exportStats,
  })

  // Export all stats as XLSX
  fastify.get('/admin/stats/export-xlsx', {
    preHandler: requirePermission(PERMISSIONS.VIEW_STATISTICS),
    handler: statisticsController.exportXlsx,
  })
}
