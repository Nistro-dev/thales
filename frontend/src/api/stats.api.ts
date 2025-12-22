import { get, apiClient } from './client'

// ============================================
// TYPES
// ============================================

export interface RealtimeStats {
  activeReservations: number
  availableProducts: number
  totalUsers: number
  totalCreditsInCirculation: number
  utilizationRate: number
}

export interface AlertItem {
  id: string
  name: string
  details?: string
}

export interface Alert {
  type: 'overdue' | 'damaged' | 'low_stock' | 'low_credits'
  severity: 'high' | 'medium' | 'low'
  count: number
  items: AlertItem[]
}

export interface Alerts {
  overdueReservations: Alert
  damagedProducts: Alert
  lowStockProducts: Alert
  usersLowCredits: Alert
}

export interface DashboardStats {
  period: {
    from: string
    to: string
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

export interface TopProductItem {
  id: string
  name: string
  reference?: string
  count?: number
  damageCount?: number
  revenue?: number
}

export interface TopProducts {
  mostReserved: TopProductItem[]
  leastReserved: TopProductItem[]
  mostDamaged: Array<TopProductItem & { damageCount: number }>
  bestRevenue: Array<TopProductItem & { revenue: number }>
}

export interface TopUserItem {
  id: string
  name: string
  email: string
  count?: number
  spent?: number
}

export interface TopUsers {
  mostActive: TopUserItem[]
  mostCancellations: TopUserItem[]
  mostOverdue: TopUserItem[]
  mostCreditsSpent: Array<TopUserItem & { spent: number }>
}

export interface SectionStats {
  id: string
  name: string
  totalProducts: number
  activeProducts: number
  totalReservations: number
  creditsGenerated: number
  averageUtilization: number
  damageReports: number
}

// ============================================
// API FUNCTIONS
// ============================================

export const statsApi = {
  // Realtime stats (polling 30s)
  getRealtimeStats: () => get<RealtimeStats>('/admin/stats/realtime'),

  // Alerts (polling 60s)
  getAlerts: () => get<Alerts>('/admin/stats/alerts'),

  // Dashboard stats with period
  getDashboardStats: (from: string, to: string) =>
    get<DashboardStats>('/admin/stats/dashboard', { from, to }),

  // Top products
  getTopProducts: (from: string, to: string, limit = 10) =>
    get<TopProducts>('/admin/stats/top-products', { from, to, limit }),

  // Top users
  getTopUsers: (from: string, to: string, limit = 10) =>
    get<TopUsers>('/admin/stats/top-users', { from, to, limit }),

  // Sections stats
  getSectionsStats: (from: string, to: string) =>
    get<SectionStats[]>('/admin/stats/sections', { from, to }),

  // Export CSV - Downloads file directly
  exportStats: async (
    from: string,
    to: string,
    type: 'reservations' | 'products' | 'users' | 'movements'
  ) => {
    const response = await apiClient.get('/admin/stats/export', {
      params: { from, to, format: 'csv', type },
      responseType: 'blob',
    })

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition']
    let filename = `export_${type}.csv`
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/)
      if (match) filename = match[1]
    }

    // Create download link
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  // Export XLSX - All data in one Excel file with multiple sheets
  exportXlsx: async (from: string, to: string) => {
    const response = await apiClient.get('/admin/stats/export-xlsx', {
      params: { from, to },
      responseType: 'blob',
    })

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition']
    let filename = 'statistiques.xlsx'
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/)
      if (match) filename = match[1]
    }

    // Create download link
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },
}
