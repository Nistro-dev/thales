// src/services/product.service.ts

import { prisma } from '../utils/prisma.js'
import { logAudit } from './audit.service.js'
import { getSignedDownloadUrl } from '../utils/s3.js'
import { FastifyRequest } from 'fastify'
import type { ProductStatus } from '@prisma/client'

interface ListProductsParams {
  page: number
  limit: number
  search?: string
  sectionId?: string
  subSectionId?: string
  status?: ProductStatus
  minPrice?: number
  maxPrice?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  includeArchived?: boolean
}

export const listProducts = async (params: ListProductsParams, userCautionStatus?: string) => {
  const {
    page,
    limit,
    search,
    sectionId,
    subSectionId,
    status,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeArchived = false,
  } = params

  const where: any = {}

  if (!includeArchived) {
    where.status = { not: 'ARCHIVED' }
  }

  if (status) {
    where.status = status
  }

  if (sectionId) {
    where.sectionId = sectionId
  }

  if (subSectionId) {
    where.subSectionId = subSectionId
  } else {
    where.subSection = {
      OR: [{ sectionId: { not: null } }, { id: undefined }],
    }
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { reference: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.priceCredits = {}
    if (minPrice !== undefined) where.priceCredits.gte = minPrice
    if (maxPrice !== undefined) where.priceCredits.lte = maxPrice
  }

  const canSeePrices = userCautionStatus === 'VALIDATED' || userCautionStatus === 'EXEMPTED'

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        reference: true,
        priceCredits: true,
        minDuration: true,
        maxDuration: true,
        status: true,
        createdAt: true,
        section: { select: { id: true, name: true } },
        subSection: { select: { id: true, name: true } },
        files: {
          where: { visibility: 'PUBLIC' },
          orderBy: { sortOrder: 'asc' },
          take: 1,
          select: { id: true, s3Key: true, mimeType: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  const formattedProducts = products.map((p) => ({
    ...p,
    priceCredits: canSeePrices ? p.priceCredits : null,
    thumbnail: p.files[0] || null,
    files: undefined,
  }))

  return { products: formattedProducts, total }
}

export const getProductById = async (id: string, userCautionStatus?: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      section: { select: { id: true, name: true, allowedDaysIn: true, allowedDaysOut: true } },
      subSection: { select: { id: true, name: true } },
      attributes: { orderBy: { key: 'asc' } },
      files: {
        where: { visibility: 'PUBLIC' },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!product) {
    throw { statusCode: 404, message: 'Produit introuvable', code: 'NOT_FOUND' }
  }

  if (product.subSection && !product.subSection.name) {
    throw { statusCode: 404, message: 'Produit non accessible', code: 'NOT_FOUND' }
  }

  const canSeePrices = userCautionStatus === 'VALIDATED' || userCautionStatus === 'EXEMPTED'

  // Generate signed URLs for files
  const filesWithUrls = await Promise.all(
    product.files.map(async (file) => ({
      ...file,
      url: await getSignedDownloadUrl(file.s3Key),
    }))
  )

  return {
    ...product,
    files: filesWithUrls,
    priceCredits: canSeePrices ? product.priceCredits : null,
  }
}

export const getProductByIdAdmin = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      section: true,
      subSection: true,
      attributes: { orderBy: { key: 'asc' } },
      files: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!product) {
    throw { statusCode: 404, message: 'Produit introuvable', code: 'NOT_FOUND' }
  }

  // Generate signed URLs for files
  const filesWithUrls = await Promise.all(
    product.files.map(async (file) => ({
      ...file,
      url: await getSignedDownloadUrl(file.s3Key),
    }))
  )

  return {
    ...product,
    files: filesWithUrls,
  }
}

interface CreateProductInput {
  name: string
  description?: string
  reference?: string
  priceCredits: number
  minDuration?: number
  maxDuration?: number
  sectionId: string
  subSectionId?: string
  attributes?: Array<{ key: string; value: string }>
}

export const createProduct = async (
  data: CreateProductInput,
  performedBy: string,
  _request?: FastifyRequest
) => {
  const section = await prisma.section.findUnique({ where: { id: data.sectionId } })

  if (!section) {
    throw { statusCode: 404, message: 'Section introuvable', code: 'NOT_FOUND' }
  }

  if (data.subSectionId) {
    const subSection = await prisma.subSection.findUnique({ where: { id: data.subSectionId } })
    if (!subSection) {
      throw { statusCode: 404, message: 'Sous-section introuvable', code: 'NOT_FOUND' }
    }
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      reference: data.reference,
      priceCredits: data.priceCredits,
      minDuration: data.minDuration ?? 1,
      maxDuration: data.maxDuration ?? 14,
      sectionId: data.sectionId,
      subSectionId: data.subSectionId,
      attributes: data.attributes ? { create: data.attributes } : undefined,
    },
    include: {
      section: true,
      subSection: true,
      attributes: true,
    },
  })

  await logAudit({
    performedBy,
    action: 'PRODUCT_CREATE',
    targetType: 'Product',
    targetId: product.id,
    metadata: { name: data.name },
  })

  return product
}

interface UpdateProductInput {
  name?: string
  description?: string
  reference?: string
  priceCredits?: number
  minDuration?: number
  maxDuration?: number
  sectionId?: string
  subSectionId?: string | null
}

export const updateProduct = async (
  id: string,
  data: UpdateProductInput,
  performedBy: string,
  _request?: FastifyRequest
) => {
  const product = await prisma.product.findUnique({ where: { id } })

  if (!product) {
    throw { statusCode: 404, message: 'Produit introuvable', code: 'NOT_FOUND' }
  }

  if (data.sectionId) {
    const section = await prisma.section.findUnique({ where: { id: data.sectionId } })
    if (!section) {
      throw { statusCode: 404, message: 'Section introuvable', code: 'NOT_FOUND' }
    }
  }

  if (data.subSectionId) {
    const subSection = await prisma.subSection.findUnique({ where: { id: data.subSectionId } })
    if (!subSection) {
      throw { statusCode: 404, message: 'Sous-section introuvable', code: 'NOT_FOUND' }
    }
  }

  const updated = await prisma.product.update({
    where: { id },
    data,
    include: {
      section: true,
      subSection: true,
      attributes: true,
    },
  })

  await logAudit({
    performedBy,
    action: 'PRODUCT_UPDATE',
    targetType: 'Product',
    targetId: id,
    metadata: data,
  })

  return updated
}

export const changeProductStatus = async (
  id: string,
  status: ProductStatus,
  performedBy: string,
  _request?: FastifyRequest
) => {
  const product = await prisma.product.findUnique({ where: { id } })

  if (!product) {
    throw { statusCode: 404, message: 'Produit introuvable', code: 'NOT_FOUND' }
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { status },
  })

  await logAudit({
    performedBy,
    action: 'PRODUCT_STATUS_CHANGE',
    targetType: 'Product',
    targetId: id,
    metadata: { oldStatus: product.status, newStatus: status },
  })

  return updated
}

export const deleteProduct = async (id: string, performedBy: string, _request?: FastifyRequest) => {
  const product = await prisma.product.findUnique({ where: { id } })

  if (!product) {
    throw { statusCode: 404, message: 'Produit introuvable', code: 'NOT_FOUND' }
  }

  await prisma.product.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  })

  await logAudit({
    performedBy,
    action: 'PRODUCT_DELETE',
    targetType: 'Product',
    targetId: id,
    metadata: { name: product.name },
  })
}

// Attributes

export const addAttribute = async (
  productId: string,
  key: string,
  value: string,
  performedBy: string,
  _request?: FastifyRequest
) => {
  const product = await prisma.product.findUnique({ where: { id: productId } })

  if (!product) {
    throw { statusCode: 404, message: 'Produit introuvable', code: 'NOT_FOUND' }
  }

  const attribute = await prisma.productAttribute.create({
    data: { productId, key, value },
  })

  await logAudit({
    performedBy,
    action: 'PRODUCT_UPDATE',
    targetType: 'Product',
    targetId: productId,
    metadata: { addedAttribute: { key, value } },
  })

  return attribute
}

export const updateAttribute = async (
  productId: string,
  key: string,
  value: string,
  performedBy: string,
  _request?: FastifyRequest
) => {
  const attribute = await prisma.productAttribute.findUnique({
    where: { productId_key: { productId, key } },
  })

  if (!attribute) {
    throw { statusCode: 404, message: 'Attribut introuvable', code: 'NOT_FOUND' }
  }

  const updated = await prisma.productAttribute.update({
    where: { productId_key: { productId, key } },
    data: { value },
  })

  await logAudit({
    performedBy,
    action: 'PRODUCT_UPDATE',
    targetType: 'Product',
    targetId: productId,
    metadata: { updatedAttribute: { key, oldValue: attribute.value, newValue: value } },
  })

  return updated
}

export const deleteAttribute = async (
  productId: string,
  key: string,
  performedBy: string,
  _request?: FastifyRequest
) => {
  const attribute = await prisma.productAttribute.findUnique({
    where: { productId_key: { productId, key } },
  })

  if (!attribute) {
    throw { statusCode: 404, message: 'Attribut introuvable', code: 'NOT_FOUND' }
  }

  await prisma.productAttribute.delete({
    where: { productId_key: { productId, key } },
  })

  await logAudit({
    performedBy,
    action: 'PRODUCT_UPDATE',
    targetType: 'Product',
    targetId: productId,
    metadata: { deletedAttribute: key },
  })
}
