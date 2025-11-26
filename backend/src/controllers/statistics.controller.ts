// src/controllers/statistics.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import * as statisticsService from '../services/statistics.service.js'
import { createSuccessResponse } from '../utils/response.js'
import {
  dashboardStatsSchema,
  topProductsSchema,
  topUsersSchema,
  sectionsStatsSchema,
  exportStatsSchema,
} from '../schemas/statistics.js'
import type {
  DashboardStatsInput,
  TopProductsInput,
  TopUsersInput,
  SectionsStatsInput,
  ExportStatsInput,
} from '../schemas/statistics.js'

// ============================================
// REALTIME STATS
// ============================================

export const getRealtimeStats = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  const stats = await statisticsService.getRealtimeStats()
  return reply.send(createSuccessResponse('Realtime stats retrieved', stats))
}

// ============================================
// ALERTS
// ============================================

export const getAlerts = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  const alerts = await statisticsService.getAlerts()
  return reply.send(createSuccessResponse('Alerts retrieved', alerts))
}

// ============================================
// DASHBOARD STATS
// ============================================

export const getDashboardStats = async (
  request: FastifyRequest<{ Querystring: DashboardStatsInput }>,
  reply: FastifyReply
) => {
  const query = dashboardStatsSchema.parse(request.query)
  const from = new Date(query.from)
  const to = new Date(query.to)

  const stats = await statisticsService.getDashboardStats(from, to)
  return reply.send(createSuccessResponse('Dashboard stats retrieved', stats))
}

// ============================================
// TOP PRODUCTS
// ============================================

export const getTopProducts = async (
  request: FastifyRequest<{ Querystring: TopProductsInput }>,
  reply: FastifyReply
) => {
  const query = topProductsSchema.parse(request.query)
  const from = new Date(query.from)
  const to = new Date(query.to)

  const stats = await statisticsService.getTopProducts(from, to, query.limit)
  return reply.send(createSuccessResponse('Top products retrieved', stats))
}

// ============================================
// TOP USERS
// ============================================

export const getTopUsers = async (
  request: FastifyRequest<{ Querystring: TopUsersInput }>,
  reply: FastifyReply
) => {
  const query = topUsersSchema.parse(request.query)
  const from = new Date(query.from)
  const to = new Date(query.to)

  const stats = await statisticsService.getTopUsers(from, to, query.limit)
  return reply.send(createSuccessResponse('Top users retrieved', stats))
}

// ============================================
// SECTIONS STATS
// ============================================

export const getSectionsStats = async (
  request: FastifyRequest<{ Querystring: SectionsStatsInput }>,
  reply: FastifyReply
) => {
  const query = sectionsStatsSchema.parse(request.query)
  const from = new Date(query.from)
  const to = new Date(query.to)

  const stats = await statisticsService.getSectionsStats(from, to)
  return reply.send(createSuccessResponse('Sections stats retrieved', stats))
}

// ============================================
// EXPORT STATS
// ============================================

export const exportStats = async (
  request: FastifyRequest<{ Querystring: ExportStatsInput }>,
  reply: FastifyReply
) => {
  const query = exportStatsSchema.parse(request.query)

  // For now, return a placeholder response
  // You can implement actual CSV/XLSX generation later with libraries like 'csv-writer' or 'xlsx'
  return reply.send(
    createSuccessResponse('Export functionality coming soon', {
      message: 'CSV/XLSX export will be implemented in the future',
      query,
    })
  )
}
