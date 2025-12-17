// src/controllers/reservation.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import * as reservationService from '../services/reservation.service.js'
import { createSuccessResponse, SuccessMessages } from '../utils/response.js'
import { listReservationsSchema } from '../schemas/reservation.js'
import { uploadToS3 } from '../utils/s3.js'
import sharp from 'sharp'
import type { ProductCondition } from '@prisma/client'
import type {
  CreateReservationInput,
  CreateReservationAdminInput,
  UpdateReservationInput,
  CancelReservationInput,
  ListReservationsInput,
  AvailabilityInput,
  RefundReservationInput,
} from '../schemas/reservation.js'
import type { CheckoutInput } from '../schemas/movement.js'

// ============================================
// USER ROUTES
// ============================================

export const listMyReservations = async (
  request: FastifyRequest<{ Querystring: ListReservationsInput }>,
  reply: FastifyReply
) => {
  const query = listReservationsSchema.parse(request.query)
  const { reservations, total } = await reservationService.listReservations(query, request.user.userId)

  return reply.send(
    createSuccessResponse(SuccessMessages.RETRIEVED, reservations, {
      page: query.page,
      limit: query.limit,
      total,
    })
  )
}

export const getMyReservation = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.getReservationById(
    request.params.id,
    request.user.userId
  )

  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, reservation))
}

export const getMyReservationQR = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  // Don't filter by userId - allow getting QR code for any reservation
  // This is useful for admins who need to help users
  const reservation = await reservationService.getReservationById(request.params.id)

  if (!reservation.qrCode) {
    throw {
      statusCode: 404,
      message: 'QR code non disponible pour cette réservation',
      code: 'NOT_FOUND',
    }
  }

  return reply.send(
    createSuccessResponse('QR code retrieved', {
      qrCode: reservation.qrCode,
      reservationId: reservation.id,
      status: reservation.status,
      user: {
        id: reservation.user.id,
        firstName: reservation.user.firstName,
        lastName: reservation.user.lastName,
      },
    })
  )
}

export const create = async (
  request: FastifyRequest<{ Body: CreateReservationInput }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.createReservation({
    userId: request.user.userId,
    productId: request.body.productId,
    startDate: request.body.startDate,
    endDate: request.body.endDate,
    notes: request.body.notes,
    createdBy: request.user.userId,
    isAdmin: false,
    request,
  })

  return reply.status(201).send(createSuccessResponse(SuccessMessages.CREATED, reservation))
}

export const cancelMine = async (
  request: FastifyRequest<{ Params: { id: string }; Body: CancelReservationInput }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.cancelReservation({
    reservationId: request.params.id,
    userId: request.user.userId,
    isAdmin: false,
    reason: request.body.reason,
    request,
  })

  return reply.send(createSuccessResponse('Reservation cancelled and refunded', reservation))
}

// ============================================
// ADMIN ROUTES
// ============================================

export const listAll = async (
  request: FastifyRequest<{ Querystring: ListReservationsInput }>,
  reply: FastifyReply
) => {
  const query = listReservationsSchema.parse(request.query)
  const { reservations, total } = await reservationService.listReservations(query)

  return reply.send(
    createSuccessResponse(SuccessMessages.RETRIEVED, reservations, {
      page: query.page,
      limit: query.limit,
      total,
    })
  )
}

export const getById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.getReservationById(request.params.id)

  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, reservation))
}

export const createAdmin = async (
  request: FastifyRequest<{ Body: CreateReservationAdminInput }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.createReservation({
    userId: request.body.userId,
    productId: request.body.productId,
    startDate: request.body.startDate,
    endDate: request.body.endDate,
    notes: request.body.notes,
    adminNotes: request.body.adminNotes,
    createdBy: request.user.userId,
    isAdmin: true,
    request,
  })

  return reply.status(201).send(createSuccessResponse(SuccessMessages.CREATED, reservation))
}

export const update = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateReservationInput }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.updateReservation({
    reservationId: request.params.id,
    adminId: request.user.userId,
    ...request.body,
    request,
  })

  return reply.send(createSuccessResponse(SuccessMessages.UPDATED, reservation))
}

export const cancelAdmin = async (
  request: FastifyRequest<{ Params: { id: string }; Body: CancelReservationInput }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.cancelReservation({
    reservationId: request.params.id,
    userId: request.user.userId,
    isAdmin: true,
    reason: request.body.reason,
    request,
  })

  return reply.send(createSuccessResponse('Reservation cancelled and refunded', reservation))
}

export const refund = async (
  request: FastifyRequest<{ Params: { id: string }; Body: RefundReservationInput }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.refundReservation({
    reservationId: request.params.id,
    adminId: request.user.userId,
    amount: request.body.amount,
    reason: request.body.reason,
    request,
  })

  return reply.send(createSuccessResponse('Reservation refunded', reservation))
}

export const checkout = async (
  request: FastifyRequest<{ Params: { id: string }; Body?: CheckoutInput }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.checkoutReservation({
    reservationId: request.params.id,
    adminId: request.user.userId,
    notes: request.body?.notes,
    request,
  })

  return reply.send(createSuccessResponse(SuccessMessages.PRODUCT_CHECKED_OUT, reservation))
}

export const returnProduct = async (
  request: FastifyRequest<{ Params: { id: string }; Body?: { condition?: string; notes?: string } }>,
  reply: FastifyReply
) => {
  const fields: Record<string, string> = {}
  const photoFiles: Array<{ buffer: Buffer; filename: string; mimetype: string }> = []

  // Check if request is multipart or JSON
  const contentType = request.headers['content-type'] || ''
  const isMultipart = contentType.includes('multipart/form-data')

  if (isMultipart) {
    // Process multipart data
    const parts = request.parts()
    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'photos') {
        const buffer = await part.toBuffer()
        photoFiles.push({
          buffer,
          filename: part.filename,
          mimetype: part.mimetype,
        })
      } else if (part.type === 'field') {
        fields[part.fieldname] = part.value as string
      }
    }
  } else {
    // Process JSON body
    const body = request.body as { condition?: string; notes?: string } | undefined
    if (body) {
      if (body.condition) fields.condition = body.condition
      if (body.notes) fields.notes = body.notes
    }
  }

  // Validate condition
  const validConditions = ['OK', 'MINOR_DAMAGE', 'MAJOR_DAMAGE', 'MISSING_PARTS', 'BROKEN']
  const condition = fields.condition || 'OK'

  if (!validConditions.includes(condition)) {
    throw {
      statusCode: 400,
      message: `Condition invalide. Doit être l'une des suivantes : ${validConditions.join(', ')}`,
      code: 'INVALID_CONDITION',
    }
  }

  // Validate max 3 photos
  if (photoFiles.length > 3) {
    throw {
      statusCode: 400,
      message: 'Maximum 3 photos autorisées',
      code: 'TOO_MANY_PHOTOS',
    }
  }

  // Compress and upload photos to S3
  const uploadedPhotos = await Promise.all(
    photoFiles.map(async (file, index) => {
      let processedBuffer = file.buffer
      let finalMimeType = file.mimetype
      let fileExtension = file.filename.split('.').pop()

      // Compress images (JPEG, PNG, WebP)
      if (file.mimetype.startsWith('image/')) {
        try {
          processedBuffer = await sharp(file.buffer)
            .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85, mozjpeg: true })
            .toBuffer()

          finalMimeType = 'image/jpeg'
          fileExtension = 'jpg'
        } catch (error) {
          // If compression fails, use original
          console.error('Image compression failed:', error)
        }
      }

      const key = `movements/${request.params.id}/return-${Date.now()}-${index}.${fileExtension}`
      await uploadToS3(key, processedBuffer, finalMimeType)

      return {
        s3Key: key,
        filename: file.filename,
        mimeType: finalMimeType,
        size: processedBuffer.length,
        sortOrder: index,
      }
    })
  )

  const reservation = await reservationService.returnReservation({
    reservationId: request.params.id,
    adminId: request.user.userId,
    condition: condition as ProductCondition,
    notes: fields.notes,
    photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
    request,
  })

  return reply.send(createSuccessResponse(SuccessMessages.PRODUCT_RETURNED, reservation))
}

// ============================================
// AVAILABILITY
// ============================================

export const getAvailability = async (
  request: FastifyRequest<{ Params: { id: string }; Querystring: AvailabilityInput }>,
  reply: FastifyReply
) => {
  const availability = await reservationService.getProductAvailability(
    request.params.id,
    request.query.month
  )

  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, availability))
}

export const checkAvailability = async (
  request: FastifyRequest<{
    Params: { id: string }
    Querystring: { startDate: string; endDate: string }
  }>,
  reply: FastifyReply
) => {
  const result = await reservationService.checkAvailability(
    request.params.id,
    request.query.startDate,
    request.query.endDate
  )

  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, result))
}
