// src/utils/qrCode.ts

import crypto from 'crypto'

const QR_CODE_SECRET = process.env.QR_CODE_SECRET

if (!QR_CODE_SECRET) {
  throw new Error('QR_CODE_SECRET is not defined in environment variables')
}

/**
 * Generate a signed QR code for a reservation
 * Format: R.reservationId.userId.signature
 * Example: "R.550e8400-e29b-41d4-a716-446655440000.660e8400-e29b-41d4-a716-446655440000.a3f5b2c1d4e6f7g8h9i0"
 */
export const generateReservationQRCode = (reservationId: string, userId: string): string => {
  const data = `R:${reservationId}:${userId}`
  const hmac = crypto.createHmac('sha256', QR_CODE_SECRET)
  hmac.update(data)
  const signature = hmac.digest('hex').substring(0, 20)

  return `R.${reservationId}.${userId}.${signature}`
}

/**
 * Verify and extract reservation data from a signed reservation QR code
 * Returns { reservationId, userId } if valid, throws error if invalid
 */
export const verifyReservationQRCode = (
  signedQRCode: string
): { reservationId: string; userId: string } => {
  const parts = signedQRCode.split('.')

  // Format: R.reservationId.userId.signature (should have 4 parts)
  if (parts.length !== 4 || parts[0] !== 'R') {
    throw {
      statusCode: 400,
      message: 'Format de QR code de réservation invalide',
      code: 'INVALID_QR_CODE',
    }
  }

  const signature = parts[3]
  const reservationId = parts[1]
  const userId = parts[2]

  // Verify signature
  const data = `R:${reservationId}:${userId}`
  const hmac = crypto.createHmac('sha256', QR_CODE_SECRET)
  hmac.update(data)
  const expectedSignature = hmac.digest('hex').substring(0, 20)

  if (signature !== expectedSignature) {
    throw {
      statusCode: 400,
      message: 'QR code invalide ou altéré',
      code: 'INVALID_QR_CODE',
    }
  }

  return { reservationId, userId }
}

/**
 * Check if a QR code is a reservation QR code
 */
export const isReservationQRCode = (code: string): boolean => {
  return code.startsWith('R.')
}
