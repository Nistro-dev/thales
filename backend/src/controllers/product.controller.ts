// src/controllers/product.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import * as productService from '../services/product.service.js'
import * as productFileService from '../services/product-file.service.js'
import { createSuccessResponse, SuccessMessages } from '../utils/response.js'
import { prisma } from '../utils/prisma.js'
import { listProductsSchema } from '../schemas/product.js'
import type {
  ListProductsInput,
  CreateProductInput,
  UpdateProductInput,
  ChangeProductStatusInput,
  ProductAttributeInput,
  ReorderFilesInput,
  SetFileVisibilityInput,
} from '../schemas/product.js'

const getUserCautionStatus = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cautionStatus: true },
  })
  return user?.cautionStatus ?? 'PENDING'
}

export const list = async (
  request: FastifyRequest<{ Querystring: ListProductsInput }>,
  reply: FastifyReply
) => {
  const query = listProductsSchema.parse(request.query)
  const cautionStatus = await getUserCautionStatus(request.user.userId)
  const { products, total } = await productService.listProducts(query, cautionStatus)

  return reply.send(
    createSuccessResponse(SuccessMessages.RETRIEVED, products, {
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
  const cautionStatus = await getUserCautionStatus(request.user.userId)
  const product = await productService.getProductById(request.params.id, cautionStatus)

  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, product))
}

export const getByIdAdmin = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const product = await productService.getProductByIdAdmin(request.params.id)
  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, product))
}

export const create = async (
  request: FastifyRequest<{ Body: CreateProductInput }>,
  reply: FastifyReply
) => {
  const product = await productService.createProduct(request.body, request.user.userId, request)
  return reply.status(201).send(createSuccessResponse(SuccessMessages.CREATED, product))
}

export const update = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateProductInput }>,
  reply: FastifyReply
) => {
  const product = await productService.updateProduct(
    request.params.id,
    request.body,
    request.user.userId,
    request
  )
  return reply.send(createSuccessResponse(SuccessMessages.UPDATED, product))
}

export const changeStatus = async (
  request: FastifyRequest<{ Params: { id: string }; Body: ChangeProductStatusInput }>,
  reply: FastifyReply
) => {
  const product = await productService.changeProductStatus(
    request.params.id,
    request.body.status,
    request.user.userId,
    request
  )
  return reply.send(createSuccessResponse(SuccessMessages.UPDATED, product))
}

export const remove = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  await productService.deleteProduct(request.params.id, request.user.userId, request)
  return reply.send(createSuccessResponse(SuccessMessages.DELETED, null))
}

// Attributes

export const addAttribute = async (
  request: FastifyRequest<{ Params: { id: string }; Body: ProductAttributeInput }>,
  reply: FastifyReply
) => {
  const attribute = await productService.addAttribute(
    request.params.id,
    request.body.key,
    request.body.value,
    request.user.userId,
    request
  )
  return reply.status(201).send(createSuccessResponse(SuccessMessages.CREATED, attribute))
}

export const updateAttribute = async (
  request: FastifyRequest<{ Params: { id: string; key: string }; Body: { value: string } }>,
  reply: FastifyReply
) => {
  const attribute = await productService.updateAttribute(
    request.params.id,
    request.params.key,
    request.body.value,
    request.user.userId,
    request
  )
  return reply.send(createSuccessResponse(SuccessMessages.UPDATED, attribute))
}

export const deleteAttribute = async (
  request: FastifyRequest<{ Params: { id: string; key: string } }>,
  reply: FastifyReply
) => {
  await productService.deleteAttribute(
    request.params.id,
    request.params.key,
    request.user.userId,
    request
  )
  return reply.send(createSuccessResponse(SuccessMessages.DELETED, null))
}

// Files

export const listFiles = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const files = await productFileService.getProductFiles(request.params.id, false)
  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, files))
}

export const listFilesAdmin = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const files = await productFileService.getProductFiles(request.params.id, true)
  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, files))
}

export const uploadFile = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const data = await request.file()

  if (!data) {
    throw { statusCode: 400, message: 'No file uploaded', code: 'VALIDATION_ERROR' }
  }

  const buffer = await data.toBuffer()

  const file = await productFileService.uploadProductFile({
    productId: request.params.id,
    buffer,
    filename: data.filename,
    mimeType: data.mimetype,
    performedBy: request.user.userId,
    request,
  })

  return reply.status(201).send(createSuccessResponse(SuccessMessages.FILE_UPLOADED, file))
}

export const deleteFile = async (
  request: FastifyRequest<{ Params: { id: string; fileId: string } }>,
  reply: FastifyReply
) => {
  await productFileService.deleteProductFile(
    request.params.id,
    request.params.fileId,
    request.user.userId,
    request
  )
  return reply.send(createSuccessResponse(SuccessMessages.FILE_DELETED, null))
}

export const reorderFiles = async (
  request: FastifyRequest<{ Params: { id: string }; Body: ReorderFilesInput }>,
  reply: FastifyReply
) => {
  await productFileService.reorderProductFiles(
    request.params.id,
    request.body.fileIds,
    request.user.userId,
    request
  )
  return reply.send(createSuccessResponse(SuccessMessages.UPDATED, null))
}

export const setFileVisibility = async (
  request: FastifyRequest<{ Params: { id: string; fileId: string }; Body: SetFileVisibilityInput }>,
  reply: FastifyReply
) => {
  const file = await productFileService.setFileVisibility(
    request.params.id,
    request.params.fileId,
    request.body.visibility,
    request.user.userId,
    request
  )
  return reply.send(createSuccessResponse(SuccessMessages.UPDATED, file))
}
