// src/services/statistics.service.ts

import { prisma } from '../utils/prisma.js'
import { ReservationStatus, ProductCondition, ProductStatus, UserStatus } from '@prisma/client'
import * as XLSX from 'xlsx'

// ============================================
// REALTIME STATS
// ============================================

interface RealtimeStats {
  activeReservations: number
  availableProducts: number
  totalUsers: number
  totalCreditsInCirculation: number
  utilizationRate: number
}

export const getRealtimeStats = async (): Promise<RealtimeStats> => {
  const [activeReservations, availableProducts, totalUsers, creditStats, totalProducts] =
    await Promise.all([
      // Active reservations (CHECKED_OUT status)
      prisma.reservation.count({
        where: { status: ReservationStatus.CHECKED_OUT },
      }),

      // Available products (status AVAILABLE)
      prisma.product.count({
        where: {
          status: ProductStatus.AVAILABLE,
        },
      }),

      // Total active users
      prisma.user.count({
        where: { status: UserStatus.ACTIVE },
      }),

      // Total credits in circulation
      prisma.user.aggregate({
        _sum: { creditBalance: true },
        where: { status: UserStatus.ACTIVE },
      }),

      // Total products (not archived)
      prisma.product.count({
        where: { status: { not: ProductStatus.ARCHIVED } },
      }),
    ])

  const utilizationRate = totalProducts > 0 ? (activeReservations / totalProducts) * 100 : 0

  return {
    activeReservations,
    availableProducts,
    totalUsers,
    totalCreditsInCirculation: creditStats._sum.creditBalance || 0,
    utilizationRate: Math.round(utilizationRate * 10) / 10,
  }
}

// ============================================
// ALERTS
// ============================================

interface Alert {
  type: 'overdue' | 'damaged' | 'low_stock' | 'low_credits'
  severity: 'high' | 'medium' | 'low'
  count: number
  items: Array<{
    id: string
    name: string
    details?: string
  }>
}

interface Alerts {
  overdueReservations: Alert
  damagedProducts: Alert
  lowStockProducts: Alert
  usersLowCredits: Alert
}

export const getAlerts = async (): Promise<Alerts> => {
  const now = new Date()

  // Overdue reservations (CHECKED_OUT and past end date)
  const overdueReservations = await prisma.reservation.findMany({
    where: {
      status: ReservationStatus.CHECKED_OUT,
      endDate: { lt: now },
    },
    include: {
      product: { select: { name: true } },
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { endDate: 'asc' },
    take: 10,
  })

  // Products with recent damage reports (last 30 days)
  const damagedProducts = await prisma.productMovement.findMany({
    where: {
      type: 'RETURN',
      condition: {
        in: [
          ProductCondition.MINOR_DAMAGE,
          ProductCondition.MAJOR_DAMAGE,
          ProductCondition.BROKEN,
          ProductCondition.MISSING_PARTS,
        ],
      },
      performedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      product: { select: { name: true, reference: true } },
    },
    orderBy: { performedAt: 'desc' },
    take: 10,
  })

  // Low stock products (disabled for now)
  const lowStockProducts: any[] = []

  // Users with low credits (less than 10)
  const usersLowCredits = await prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      creditBalance: { lt: 10, gt: 0 },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      creditBalance: true,
    },
    orderBy: { creditBalance: 'asc' },
    take: 10,
  })

  return {
    overdueReservations: {
      type: 'overdue',
      severity: overdueReservations.length > 5 ? 'high' : overdueReservations.length > 0 ? 'medium' : 'low',
      count: overdueReservations.length,
      items: overdueReservations.map((r) => ({
        id: r.id,
        name: `${r.product.name} - ${r.user.firstName} ${r.user.lastName}`,
        details: `Due: ${r.endDate.toISOString().split('T')[0]}`,
      })),
    },
    damagedProducts: {
      type: 'damaged',
      severity: damagedProducts.length > 3 ? 'high' : damagedProducts.length > 0 ? 'medium' : 'low',
      count: damagedProducts.length,
      items: damagedProducts.map((m) => ({
        id: m.productId,
        name: m.product.name,
        details: `Condition: ${m.condition}`,
      })),
    },
    lowStockProducts: {
      type: 'low_stock',
      severity: 'low',
      count: lowStockProducts.length,
      items: lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        details: p.reference || undefined,
      })),
    },
    usersLowCredits: {
      type: 'low_credits',
      severity: usersLowCredits.length > 10 ? 'medium' : 'low',
      count: usersLowCredits.length,
      items: usersLowCredits.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        details: `${u.creditBalance} credits`,
      })),
    },
  }
}

// ============================================
// DASHBOARD STATS (PERIOD)
// ============================================

interface DashboardStats {
  period: {
    from: Date
    to: Date
  }
  reservations: {
    total: number
    completed: number
    cancelled: number
    active: number
    byStatus: Record<string, number>
  }
  credits: {
    totalSpent: number
    totalRefunded: number
    averagePerReservation: number
  }
  products: {
    totalReservations: number
    uniqueProducts: number
    averageUtilization: number
  }
  users: {
    totalActive: number
    newUsers: number
    activeReservers: number
  }
  charts: {
    reservationsByDay: Array<{ date: string; count: number }>
    creditsByDay: Array<{ date: string; spent: number; refunded: number }>
    topSections: Array<{ section: string; count: number }>
  }
}

export const getDashboardStats = async (from: Date, to: Date): Promise<DashboardStats> => {
  // Reservations in period
  const reservations = await prisma.reservation.findMany({
    where: {
      createdAt: { gte: from, lte: to },
    },
    select: {
      id: true,
      status: true,
      creditsCharged: true,
      totalExtensionCost: true,
      refundAmount: true,
      createdAt: true,
      productId: true,
      userId: true,
    },
  })

  const reservationsByStatus: Record<string, number> = {}
  let totalCreditsSpent = 0
  let totalCreditsRefunded = 0

  reservations.forEach((r) => {
    reservationsByStatus[r.status] = (reservationsByStatus[r.status] || 0) + 1
    totalCreditsSpent += r.creditsCharged + (r.totalExtensionCost || 0)
    totalCreditsRefunded += r.refundAmount || 0
  })

  // Unique products and users
  const uniqueProducts = new Set(reservations.map((r) => r.productId)).size
  const activeReservers = new Set(reservations.map((r) => r.userId)).size

  // New users in period
  const newUsers = await prisma.user.count({
    where: {
      createdAt: { gte: from, lte: to },
    },
  })

  // Total active users
  const totalActiveUsers = await prisma.user.count({
    where: { status: UserStatus.ACTIVE },
  })

  // Reservations by day
  const reservationsByDay: Record<string, number> = {}
  reservations.forEach((r) => {
    const date = r.createdAt.toISOString().split('T')[0]
    reservationsByDay[date] = (reservationsByDay[date] || 0) + 1
  })

  // Credits by day
  const creditsByDay: Record<string, { spent: number; refunded: number }> = {}
  reservations.forEach((r) => {
    const date = r.createdAt.toISOString().split('T')[0]
    if (!creditsByDay[date]) {
      creditsByDay[date] = { spent: 0, refunded: 0 }
    }
    creditsByDay[date].spent += r.creditsCharged + (r.totalExtensionCost || 0)
    creditsByDay[date].refunded += r.refundAmount || 0
  })

  // Top sections
  const sectionStats = await prisma.reservation.groupBy({
    by: ['productId'],
    where: {
      createdAt: { gte: from, lte: to },
    },
    _count: { id: true },
  })

  const productIds = sectionStats.map((s) => s.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, sectionId: true },
  })

  const sectionCounts: Record<string, number> = {}
  sectionStats.forEach((stat) => {
    const product = products.find((p) => p.id === stat.productId)
    if (product?.sectionId) {
      sectionCounts[product.sectionId] = (sectionCounts[product.sectionId] || 0) + stat._count.id
    }
  })

  const sections = await prisma.section.findMany({
    where: { id: { in: Object.keys(sectionCounts) } },
    select: { id: true, name: true },
  })

  const topSections = Object.entries(sectionCounts)
    .map(([sectionId, count]) => ({
      section: sections.find((s) => s.id === sectionId)?.name || 'Unknown',
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    period: { from, to },
    reservations: {
      total: reservations.length,
      completed: reservationsByStatus[ReservationStatus.RETURNED] || 0,
      cancelled: reservationsByStatus[ReservationStatus.CANCELLED] || 0,
      active: reservationsByStatus[ReservationStatus.CHECKED_OUT] || 0,
      byStatus: reservationsByStatus,
    },
    credits: {
      totalSpent: totalCreditsSpent,
      totalRefunded: totalCreditsRefunded,
      averagePerReservation: reservations.length > 0 ? totalCreditsSpent / reservations.length : 0,
    },
    products: {
      totalReservations: reservations.length,
      uniqueProducts,
      averageUtilization: uniqueProducts > 0 ? reservations.length / uniqueProducts : 0,
    },
    users: {
      totalActive: totalActiveUsers,
      newUsers,
      activeReservers,
    },
    charts: {
      reservationsByDay: Object.entries(reservationsByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      creditsByDay: Object.entries(creditsByDay)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topSections,
    },
  }
}

// ============================================
// TOP PRODUCTS
// ============================================

interface TopProducts {
  mostReserved: Array<{
    id: string
    name: string
    reference?: string
    count: number
  }>
  leastReserved: Array<{
    id: string
    name: string
    reference?: string
    count: number
  }>
  mostDamaged: Array<{
    id: string
    name: string
    reference?: string
    damageCount: number
  }>
  bestRevenue: Array<{
    id: string
    name: string
    reference?: string
    revenue: number
  }>
}

export const getTopProducts = async (from: Date, to: Date, limit: number): Promise<TopProducts> => {
  // Most reserved
  const mostReserved = await prisma.reservation.groupBy({
    by: ['productId'],
    where: {
      createdAt: { gte: from, lte: to },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  })

  const mostReservedProducts = await prisma.product.findMany({
    where: { id: { in: mostReserved.map((r) => r.productId) } },
    select: { id: true, name: true, reference: true },
  })

  // Least reserved (products with some reservations but fewer)
  const leastReserved = await prisma.reservation.groupBy({
    by: ['productId'],
    where: {
      createdAt: { gte: from, lte: to },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'asc' } },
    take: limit,
  })

  const leastReservedProducts = await prisma.product.findMany({
    where: { id: { in: leastReserved.map((r) => r.productId) } },
    select: { id: true, name: true, reference: true },
  })

  // Most damaged
  const mostDamaged = await prisma.productMovement.groupBy({
    by: ['productId'],
    where: {
      type: 'RETURN',
      condition: {
        in: [ProductCondition.MINOR_DAMAGE, ProductCondition.MAJOR_DAMAGE, ProductCondition.BROKEN],
      },
      performedAt: { gte: from, lte: to },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  })

  const mostDamagedProducts = await prisma.product.findMany({
    where: { id: { in: mostDamaged.map((m) => m.productId) } },
    select: { id: true, name: true, reference: true },
  })

  // Best revenue (most credits generated)
  const bestRevenue = await prisma.reservation.groupBy({
    by: ['productId'],
    where: {
      createdAt: { gte: from, lte: to },
    },
    _sum: {
      creditsCharged: true,
      totalExtensionCost: true,
    },
    orderBy: { _sum: { creditsCharged: 'desc' } },
    take: limit,
  })

  const bestRevenueProducts = await prisma.product.findMany({
    where: { id: { in: bestRevenue.map((r) => r.productId) } },
    select: { id: true, name: true, reference: true },
  })

  return {
    mostReserved: mostReserved.map((r) => {
      const product = mostReservedProducts.find((p) => p.id === r.productId)
      return {
        id: r.productId,
        name: product?.name || 'Unknown',
        reference: product?.reference || undefined,
        count: r._count.id,
      }
    }),
    leastReserved: leastReserved.map((r) => {
      const product = leastReservedProducts.find((p) => p.id === r.productId)
      return {
        id: r.productId,
        name: product?.name || 'Unknown',
        reference: product?.reference || undefined,
        count: r._count.id,
      }
    }),
    mostDamaged: mostDamaged.map((m) => {
      const product = mostDamagedProducts.find((p) => p.id === m.productId)
      return {
        id: m.productId,
        name: product?.name || 'Unknown',
        reference: product?.reference || undefined,
        damageCount: m._count.id,
      }
    }),
    bestRevenue: bestRevenue.map((r) => {
      const product = bestRevenueProducts.find((p) => p.id === r.productId)
      return {
        id: r.productId,
        name: product?.name || 'Unknown',
        reference: product?.reference || undefined,
        revenue: (r._sum.creditsCharged || 0) + (r._sum.totalExtensionCost || 0),
      }
    }),
  }
}

// ============================================
// TOP USERS
// ============================================

interface TopUsers {
  mostActive: Array<{
    id: string
    name: string
    email: string
    count: number
  }>
  mostCancellations: Array<{
    id: string
    name: string
    email: string
    count: number
  }>
  mostOverdue: Array<{
    id: string
    name: string
    email: string
    count: number
  }>
  mostCreditsSpent: Array<{
    id: string
    name: string
    email: string
    spent: number
  }>
}

export const getTopUsers = async (from: Date, to: Date, limit: number): Promise<TopUsers> => {
  // Most active (most reservations)
  const mostActive = await prisma.reservation.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gte: from, lte: to },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  })

  const mostActiveUsers = await prisma.user.findMany({
    where: { id: { in: mostActive.map((r) => r.userId) } },
    select: { id: true, firstName: true, lastName: true, email: true },
  })

  // Most cancellations
  const mostCancellations = await prisma.reservation.groupBy({
    by: ['userId'],
    where: {
      status: ReservationStatus.CANCELLED,
      createdAt: { gte: from, lte: to },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  })

  const mostCancellationsUsers = await prisma.user.findMany({
    where: { id: { in: mostCancellations.map((r) => r.userId) } },
    select: { id: true, firstName: true, lastName: true, email: true },
  })

  // Most overdue (reservations that were CHECKED_OUT past end date)
  const now = new Date()
  const overdueReservations = await prisma.reservation.findMany({
    where: {
      status: ReservationStatus.CHECKED_OUT,
      endDate: { lt: now, gte: from },
    },
    select: { userId: true },
  })

  const overdueCounts: Record<string, number> = {}
  overdueReservations.forEach((r) => {
    overdueCounts[r.userId] = (overdueCounts[r.userId] || 0) + 1
  })

  const topOverdueUserIds = Object.entries(overdueCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([userId]) => userId)

  const mostOverdueUsers = await prisma.user.findMany({
    where: { id: { in: topOverdueUserIds } },
    select: { id: true, firstName: true, lastName: true, email: true },
  })

  // Most credits spent
  const mostCreditsSpent = await prisma.reservation.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gte: from, lte: to },
    },
    _sum: {
      creditsCharged: true,
      totalExtensionCost: true,
    },
    orderBy: { _sum: { creditsCharged: 'desc' } },
    take: limit,
  })

  const mostCreditsSpentUsers = await prisma.user.findMany({
    where: { id: { in: mostCreditsSpent.map((r) => r.userId) } },
    select: { id: true, firstName: true, lastName: true, email: true },
  })

  return {
    mostActive: mostActive.map((r) => {
      const user = mostActiveUsers.find((u) => u.id === r.userId)
      return {
        id: r.userId,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        email: user?.email || '',
        count: r._count.id,
      }
    }),
    mostCancellations: mostCancellations.map((r) => {
      const user = mostCancellationsUsers.find((u) => u.id === r.userId)
      return {
        id: r.userId,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        email: user?.email || '',
        count: r._count.id,
      }
    }),
    mostOverdue: topOverdueUserIds.map((userId) => {
      const user = mostOverdueUsers.find((u) => u.id === userId)
      return {
        id: userId,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        email: user?.email || '',
        count: overdueCounts[userId],
      }
    }),
    mostCreditsSpent: mostCreditsSpent.map((r) => {
      const user = mostCreditsSpentUsers.find((u) => u.id === r.userId)
      return {
        id: r.userId,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        email: user?.email || '',
        spent: (r._sum.creditsCharged || 0) + (r._sum.totalExtensionCost || 0),
      }
    }),
  }
}

// ============================================
// SECTIONS STATS
// ============================================

interface SectionStats {
  id: string
  name: string
  totalProducts: number
  activeProducts: number
  totalReservations: number
  creditsGenerated: number
  averageUtilization: number
  damageReports: number
}

export const getSectionsStats = async (from: Date, to: Date): Promise<SectionStats[]> => {
  const sections = await prisma.section.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  const stats = await Promise.all(
    sections.map(async (section) => {
      const [totalProducts, activeProducts, reservations, damageReports] = await Promise.all([
        // Total products in section
        prisma.product.count({
          where: { sectionId: section.id },
        }),

        // Active products (not archived)
        prisma.product.count({
          where: { sectionId: section.id, status: { not: ProductStatus.ARCHIVED } },
        }),

        // Reservations in period
        prisma.reservation.findMany({
          where: {
            product: { sectionId: section.id },
            createdAt: { gte: from, lte: to },
          },
          select: {
            creditsCharged: true,
            totalExtensionCost: true,
          },
        }),

        // Damage reports
        prisma.productMovement.count({
          where: {
            product: { sectionId: section.id },
            type: 'RETURN',
            condition: {
              in: [ProductCondition.MINOR_DAMAGE, ProductCondition.MAJOR_DAMAGE, ProductCondition.BROKEN],
            },
            performedAt: { gte: from, lte: to },
          },
        }),
      ])

      const creditsGenerated = reservations.reduce(
        (sum, r) => sum + r.creditsCharged + (r.totalExtensionCost || 0),
        0
      )

      return {
        id: section.id,
        name: section.name,
        totalProducts,
        activeProducts,
        totalReservations: reservations.length,
        creditsGenerated,
        averageUtilization:
          activeProducts > 0 ? Math.round((reservations.length / activeProducts) * 10) / 10 : 0,
        damageReports,
      }
    })
  )

  return stats.sort((a, b) => b.totalReservations - a.totalReservations)
}

// ============================================
// EXPORT STATS (CSV)
// ============================================

type ExportType = 'reservations' | 'products' | 'users' | 'movements'

interface ExportResult {
  filename: string
  content: string
  mimeType: string
}

const escapeCSV = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

const formatDateTime = (date: Date): string => {
  return date.toISOString().replace('T', ' ').split('.')[0]
}

export const exportStats = async (
  from: Date,
  to: Date,
  type: ExportType
): Promise<ExportResult> => {
  const dateRange = `${formatDate(from)}_${formatDate(to)}`

  switch (type) {
    case 'reservations':
      return exportReservations(from, to, dateRange)
    case 'products':
      return exportProducts(from, to, dateRange)
    case 'users':
      return exportUsers(from, to, dateRange)
    case 'movements':
      return exportMovements(from, to, dateRange)
    default:
      throw new Error(`Type d'export non supporté: ${type}`)
  }
}

const exportReservations = async (from: Date, to: Date, dateRange: string): Promise<ExportResult> => {
  const reservations = await prisma.reservation.findMany({
    where: {
      createdAt: { gte: from, lte: to },
    },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      product: { select: { name: true, reference: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'ID',
    'Date création',
    'Date début',
    'Date fin',
    'Statut',
    'Produit',
    'Référence produit',
    'Utilisateur',
    'Email',
    'Crédits facturés',
    'Coût extensions',
    'Remboursement',
    'Motif annulation',
  ]

  const rows = reservations.map((r) => [
    r.id,
    formatDateTime(r.createdAt),
    formatDate(r.startDate),
    formatDate(r.endDate),
    r.status,
    r.product.name,
    r.product.reference || '',
    `${r.user.firstName} ${r.user.lastName}`,
    r.user.email,
    r.creditsCharged,
    r.totalExtensionCost || 0,
    r.refundAmount || 0,
    r.cancelReason || '',
  ])

  const csv = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n')

  return {
    filename: `reservations_${dateRange}.csv`,
    content: csv,
    mimeType: 'text/csv',
  }
}

const exportProducts = async (from: Date, to: Date, dateRange: string): Promise<ExportResult> => {
  const products = await prisma.product.findMany({
    include: {
      section: { select: { name: true } },
      _count: {
        select: {
          reservations: {
            where: { createdAt: { gte: from, lte: to } },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Get credits generated per product
  const creditsPerProduct = await prisma.reservation.groupBy({
    by: ['productId'],
    where: { createdAt: { gte: from, lte: to } },
    _sum: { creditsCharged: true, totalExtensionCost: true },
  })

  const creditsMap = new Map(
    creditsPerProduct.map((c) => [
      c.productId,
      (c._sum.creditsCharged || 0) + (c._sum.totalExtensionCost || 0),
    ])
  )

  const headers = [
    'ID',
    'Nom',
    'Référence',
    'Section',
    'Statut',
    'Condition',
    'Prix (crédits)',
    'Réservations (période)',
    'Crédits générés (période)',
    'Date création',
  ]

  const rows = products.map((p) => [
    p.id,
    p.name,
    p.reference || '',
    p.section?.name || '',
    p.status,
    p.lastCondition,
    p.priceCredits,
    p._count.reservations,
    creditsMap.get(p.id) || 0,
    formatDateTime(p.createdAt),
  ])

  const csv = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n')

  return {
    filename: `produits_${dateRange}.csv`,
    content: csv,
    mimeType: 'text/csv',
  }
}

const exportUsers = async (from: Date, to: Date, dateRange: string): Promise<ExportResult> => {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          reservations: {
            where: { createdAt: { gte: from, lte: to } },
          },
        },
      },
    },
    orderBy: { lastName: 'asc' },
  })

  // Get credits spent per user
  const creditsPerUser = await prisma.reservation.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: from, lte: to } },
    _sum: { creditsCharged: true, totalExtensionCost: true },
  })

  const creditsMap = new Map(
    creditsPerUser.map((c) => [
      c.userId,
      (c._sum.creditsCharged || 0) + (c._sum.totalExtensionCost || 0),
    ])
  )

  const headers = [
    'ID',
    'Nom',
    'Prénom',
    'Email',
    'Statut',
    'Crédits actuels',
    'Caution',
    'Réservations (période)',
    'Crédits dépensés (période)',
    'Dernière connexion',
    'Date création',
  ]

  const rows = users.map((u) => [
    u.id,
    u.lastName,
    u.firstName,
    u.email,
    u.status,
    u.creditBalance,
    u.cautionStatus,
    u._count.reservations,
    creditsMap.get(u.id) || 0,
    u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '',
    formatDateTime(u.createdAt),
  ])

  const csv = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n')

  return {
    filename: `utilisateurs_${dateRange}.csv`,
    content: csv,
    mimeType: 'text/csv',
  }
}

const exportMovements = async (from: Date, to: Date, dateRange: string): Promise<ExportResult> => {
  const movements = await prisma.productMovement.findMany({
    where: {
      performedAt: { gte: from, lte: to },
    },
    orderBy: { performedAt: 'desc' },
  })

  // Get related data
  const productIds = [...new Set(movements.map((m) => m.productId))]
  const userIds = [...new Set(movements.map((m) => m.performedBy))]
  const reservationIds = movements.map((m) => m.reservationId).filter(Boolean) as string[]

  const [products, users, reservations] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, reference: true },
    }),
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.reservation.findMany({
      where: { id: { in: reservationIds } },
      select: { id: true, user: { select: { firstName: true, lastName: true } } },
    }),
  ])

  const productMap = new Map(products.map((p) => [p.id, p]))
  const userMap = new Map(users.map((u) => [u.id, u]))
  const reservationMap = new Map(reservations.map((r) => [r.id, r]))

  const headers = [
    'ID',
    'Date',
    'Type',
    'Produit',
    'Référence produit',
    'Condition',
    'Notes',
    'Utilisateur réservation',
    'Effectué par',
  ]

  const rows = movements.map((m) => {
    const product = productMap.get(m.productId)
    const performedByUser = userMap.get(m.performedBy)
    const reservation = m.reservationId ? reservationMap.get(m.reservationId) : null
    return [
      m.id,
      formatDateTime(m.performedAt),
      m.type,
      product?.name || '',
      product?.reference || '',
      m.condition || '',
      m.notes || '',
      reservation?.user
        ? `${reservation.user.firstName} ${reservation.user.lastName}`
        : '',
      performedByUser
        ? `${performedByUser.firstName} ${performedByUser.lastName}`
        : m.performedBy,
    ]
  })

  const csv = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n')

  return {
    filename: `mouvements_${dateRange}.csv`,
    content: csv,
    mimeType: 'text/csv',
  }
}

// ============================================
// EXPORT EXCEL (XLSX) - ALL DATA IN ONE FILE
// ============================================

interface ExportXlsxResult {
  filename: string
  buffer: Buffer
  mimeType: string
}

export const exportAllToXlsx = async (from: Date, to: Date): Promise<ExportXlsxResult> => {
  const dateRange = `${formatDate(from)}_${formatDate(to)}`

  // Fetch all data in parallel
  const [reservationsData, productsData, usersData, movementsData] = await Promise.all([
    getReservationsData(from, to),
    getProductsData(from, to),
    getUsersData(from, to),
    getMovementsData(from, to),
  ])

  // Create workbook
  const workbook = XLSX.utils.book_new()

  // Add Reservations sheet
  const reservationsSheet = XLSX.utils.aoa_to_sheet([
    reservationsData.headers,
    ...reservationsData.rows,
  ])
  XLSX.utils.book_append_sheet(workbook, reservationsSheet, 'Réservations')

  // Add Products sheet
  const productsSheet = XLSX.utils.aoa_to_sheet([
    productsData.headers,
    ...productsData.rows,
  ])
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Produits')

  // Add Users sheet
  const usersSheet = XLSX.utils.aoa_to_sheet([
    usersData.headers,
    ...usersData.rows,
  ])
  XLSX.utils.book_append_sheet(workbook, usersSheet, 'Utilisateurs')

  // Add Movements sheet
  const movementsSheet = XLSX.utils.aoa_to_sheet([
    movementsData.headers,
    ...movementsData.rows,
  ])
  XLSX.utils.book_append_sheet(workbook, movementsSheet, 'Mouvements')

  // Add Summary sheet
  const summaryData = await getSummaryData(from, to)
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé')

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return {
    filename: `statistiques_${dateRange}.xlsx`,
    buffer: Buffer.from(buffer),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }
}

// Helper functions to get data with headers and rows
async function getReservationsData(from: Date, to: Date) {
  const reservations = await prisma.reservation.findMany({
    where: { createdAt: { gte: from, lte: to } },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      product: { select: { name: true, reference: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'ID',
    'Date création',
    'Date début',
    'Date fin',
    'Statut',
    'Produit',
    'Référence produit',
    'Utilisateur',
    'Email',
    'Crédits facturés',
    'Coût extensions',
    'Remboursement',
    'Motif annulation',
  ]

  const rows = reservations.map((r) => [
    r.id,
    formatDateTime(r.createdAt),
    formatDate(r.startDate),
    formatDate(r.endDate),
    r.status,
    r.product.name,
    r.product.reference || '',
    `${r.user.firstName} ${r.user.lastName}`,
    r.user.email,
    r.creditsCharged,
    r.totalExtensionCost || 0,
    r.refundAmount || 0,
    r.cancelReason || '',
  ])

  return { headers, rows }
}

async function getProductsData(from: Date, to: Date) {
  const products = await prisma.product.findMany({
    include: {
      section: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
  })

  const creditsPerProduct = await prisma.reservation.groupBy({
    by: ['productId'],
    where: { createdAt: { gte: from, lte: to } },
    _sum: { creditsCharged: true, totalExtensionCost: true },
    _count: { id: true },
  })

  const statsMap = new Map(
    creditsPerProduct.map((c) => [
      c.productId,
      {
        credits: (c._sum.creditsCharged || 0) + (c._sum.totalExtensionCost || 0),
        count: c._count.id,
      },
    ])
  )

  const headers = [
    'ID',
    'Nom',
    'Référence',
    'Section',
    'Statut',
    'Condition',
    'Prix (crédits)',
    'Réservations (période)',
    'Crédits générés (période)',
    'Date création',
  ]

  const rows = products.map((p) => {
    const stats = statsMap.get(p.id) || { credits: 0, count: 0 }
    return [
      p.id,
      p.name,
      p.reference || '',
      p.section?.name || '',
      p.status,
      p.lastCondition,
      p.priceCredits,
      stats.count,
      stats.credits,
      formatDateTime(p.createdAt),
    ]
  })

  return { headers, rows }
}

async function getUsersData(from: Date, to: Date) {
  const users = await prisma.user.findMany({
    orderBy: { lastName: 'asc' },
  })

  const statsPerUser = await prisma.reservation.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: from, lte: to } },
    _sum: { creditsCharged: true, totalExtensionCost: true },
    _count: { id: true },
  })

  const statsMap = new Map(
    statsPerUser.map((c) => [
      c.userId,
      {
        credits: (c._sum.creditsCharged || 0) + (c._sum.totalExtensionCost || 0),
        count: c._count.id,
      },
    ])
  )

  const headers = [
    'ID',
    'Nom',
    'Prénom',
    'Email',
    'Statut',
    'Crédits actuels',
    'Caution',
    'Réservations (période)',
    'Crédits dépensés (période)',
    'Dernière connexion',
    'Date création',
  ]

  const rows = users.map((u) => {
    const stats = statsMap.get(u.id) || { credits: 0, count: 0 }
    return [
      u.id,
      u.lastName,
      u.firstName,
      u.email,
      u.status,
      u.creditBalance,
      u.cautionStatus,
      stats.count,
      stats.credits,
      u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '',
      formatDateTime(u.createdAt),
    ]
  })

  return { headers, rows }
}

async function getMovementsData(from: Date, to: Date) {
  const movements = await prisma.productMovement.findMany({
    where: { performedAt: { gte: from, lte: to } },
    orderBy: { performedAt: 'desc' },
  })

  // Get related data
  const productIds = [...new Set(movements.map((m) => m.productId))]
  const userIds = [...new Set(movements.map((m) => m.performedBy))]
  const reservationIds = movements.map((m) => m.reservationId).filter(Boolean) as string[]

  const [products, users, reservations] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, reference: true },
    }),
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.reservation.findMany({
      where: { id: { in: reservationIds } },
      select: { id: true, user: { select: { firstName: true, lastName: true } } },
    }),
  ])

  const productMap = new Map(products.map((p) => [p.id, p]))
  const userMap = new Map(users.map((u) => [u.id, u]))
  const reservationMap = new Map(reservations.map((r) => [r.id, r]))

  const headers = [
    'ID',
    'Date',
    'Type',
    'Produit',
    'Référence produit',
    'Condition',
    'Notes',
    'Utilisateur réservation',
    'Effectué par',
  ]

  const rows = movements.map((m) => {
    const product = productMap.get(m.productId)
    const performedByUser = userMap.get(m.performedBy)
    const reservation = m.reservationId ? reservationMap.get(m.reservationId) : null
    return [
      m.id,
      formatDateTime(m.performedAt),
      m.type,
      product?.name || '',
      product?.reference || '',
      m.condition || '',
      m.notes || '',
      reservation?.user
        ? `${reservation.user.firstName} ${reservation.user.lastName}`
        : '',
      performedByUser
        ? `${performedByUser.firstName} ${performedByUser.lastName}`
        : m.performedBy,
    ]
  })

  return { headers, rows }
}

async function getSummaryData(from: Date, to: Date): Promise<(string | number)[][]> {
  const [
    totalReservations,
    completedReservations,
    cancelledReservations,
    activeReservations,
    totalProducts,
    totalUsers,
    newUsers,
    creditsStats,
  ] = await Promise.all([
    prisma.reservation.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.reservation.count({
      where: { createdAt: { gte: from, lte: to }, status: ReservationStatus.RETURNED },
    }),
    prisma.reservation.count({
      where: { createdAt: { gte: from, lte: to }, status: ReservationStatus.CANCELLED },
    }),
    prisma.reservation.count({
      where: { createdAt: { gte: from, lte: to }, status: ReservationStatus.CHECKED_OUT },
    }),
    prisma.product.count({ where: { status: { not: ProductStatus.ARCHIVED } } }),
    prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
    prisma.user.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.reservation.aggregate({
      where: { createdAt: { gte: from, lte: to } },
      _sum: { creditsCharged: true, totalExtensionCost: true, refundAmount: true },
    }),
  ])

  const totalCreditsSpent =
    (creditsStats._sum.creditsCharged || 0) + (creditsStats._sum.totalExtensionCost || 0)
  const totalRefunded = creditsStats._sum.refundAmount || 0

  return [
    ['RÉSUMÉ DES STATISTIQUES'],
    [''],
    ['Période', `${formatDate(from)} au ${formatDate(to)}`],
    [''],
    ['RÉSERVATIONS'],
    ['Total réservations', totalReservations],
    ['Terminées', completedReservations],
    ['Annulées', cancelledReservations],
    ['En cours', activeReservations],
    [''],
    ['CRÉDITS'],
    ['Total dépensés', totalCreditsSpent],
    ['Total remboursés', totalRefunded],
    ['Net', totalCreditsSpent - totalRefunded],
    [''],
    ['UTILISATEURS'],
    ['Total actifs', totalUsers],
    ['Nouveaux (période)', newUsers],
    [''],
    ['PRODUITS'],
    ['Total actifs', totalProducts],
  ]
}
