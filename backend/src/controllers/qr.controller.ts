// src/controllers/qr.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import * as qrService from '../services/qr.service.js'
import { createSuccessResponse } from '../utils/response.js'

export const getProductByQR = async (
  request: FastifyRequest<{ Params: { qrCode: string } }>,
  reply: FastifyReply
) => {
  const result = await qrService.getProductByQRCode(request.params.qrCode)
  return reply.send(createSuccessResponse('Product found', result))
}

export const regenerateQR = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const result = await qrService.regenerateQRCode(request.params.id)
  return reply.send(createSuccessResponse('QR code regenerated', result))
}