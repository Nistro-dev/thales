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
  exportXlsxSchema,
} from '../schemas/statistics.js'
import type {
  DashboardStatsInput,
  TopProductsInput,
  TopUsersInput,
  SectionsStatsInput,
  ExportStatsInput,
  ExportXlsxInput,
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

// Helper to set end of day (23:59:59.999)
const endOfDay = (date: Date): Date => {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export const getDashboardStats = async (
  request: FastifyRequest<{ Querystring: DashboardStatsInput }>,
  reply: FastifyReply
) => {
  const query = dashboardStatsSchema.parse(request.query)
  const from = new Date(query.from)
  const to = endOfDay(new Date(query.to))

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
  const to = endOfDay(new Date(query.to))

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
  const to = endOfDay(new Date(query.to))

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
  const to = endOfDay(new Date(query.to))

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
  const from = new Date(query.from)
  const to = endOfDay(new Date(query.to))

  const result = await statisticsService.exportStats(from, to, query.type)

  // Set headers for file download
  reply.header('Content-Type', `${result.mimeType}; charset=utf-8`)
  reply.header('Content-Disposition', `attachment; filename="${result.filename}"`)

  return reply.send(result.content)
}

// ============================================
// EXPORT XLSX (ALL DATA)
// ============================================

export const exportXlsx = async (
  request: FastifyRequest<{ Querystring: ExportXlsxInput }>,
  reply: FastifyReply
) => {
  const query = exportXlsxSchema.parse(request.query)
  const from = new Date(query.from)
  const to = endOfDay(new Date(query.to))

  const result = await statisticsService.exportAllToXlsx(from, to)

  // Set headers for file download
  reply.header('Content-Type', result.mimeType)
  reply.header('Content-Disposition', `attachment; filename="${result.filename}"`)

  return reply.send(result.buffer)
}
