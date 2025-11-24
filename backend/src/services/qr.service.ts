// src/services/qr.service.ts

import { prisma } from '../utils/prisma.js'
import { randomUUID } from 'crypto'

export const getProductByQRCode = async (qrCode: string) => {
  const product = await prisma.product.findUnique({
    where: { qrCode },
    include: {
      section: { select: { id: true, name: true } },
      subSection: { select: { id: true, name: true } },
    },
  })

  if (!product) {
    throw { statusCode: 404, message: 'Product not found for this QR code', code: 'NOT_FOUND' }
  }

  const activeReservation = await prisma.reservation.findFirst({
    where: {
      productId: product.id,
      status: { in: ['CONFIRMED', 'CHECKED_OUT'] },
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
    orderBy: { startDate: 'asc' },
  })

  return {
    product,
    activeReservation,
  }
}

export const regenerateQRCode = async (productId: string) => {
  const product = await prisma.product.findUnique({ where: { id: productId } })

  if (!product) {
    throw { statusCode: 404, message: 'Product not found', code: 'NOT_FOUND' }
  }

  const newQrCode = randomUUID()

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { qrCode: newQrCode },
    select: { id: true, qrCode: true },
  })

  return updated
}