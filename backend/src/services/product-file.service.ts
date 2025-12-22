// src/services/product-file.service.ts

import { prisma } from '../utils/prisma.js'
import { uploadToS3, deleteFromS3, getSignedDownloadUrl } from '../utils/s3.js'
import { compressFile, isCompressibleType } from './file-compression.service.js'
import { logAudit } from './audit.service.js'
import { FastifyRequest } from 'fastify'
import crypto from 'crypto'
import type { FileVisibility } from '@prisma/client'

interface UploadFileParams {
  productId: string
  buffer: Buffer
  filename: string
  mimeType: string
  visibility?: FileVisibility
  performedBy: string
  request?: FastifyRequest
}

export const uploadProductFile = async (params: UploadFileParams) => {
  const {
    productId,
    buffer,
    filename,
    mimeType,
    visibility = 'PUBLIC',
    performedBy,
  } = params

  const product = await prisma.product.findUnique({ where: { id: productId } })

  if (!product) {
    throw { statusCode: 404, message: 'Produit introuvable', code: 'NOT_FOUND' }
  }

  let finalBuffer = buffer
  let finalMimeType = mimeType
  let finalSize = buffer.length
  let finalFilename = filename

  if (isCompressibleType(mimeType)) {
    const compressed = await compressFile(buffer, mimeType, filename)
    finalBuffer = compressed.buffer
    finalMimeType = compressed.mimeType
    finalSize = compressed.size
    // Use new filename if format changed (e.g., photo.png -> photo.webp)
    if (compressed.newFilename) {
      finalFilename = compressed.newFilename
    }
  }

  const fileId = crypto.randomBytes(8).toString('hex')
  const ext = finalFilename.split('.').pop() || ''
  const s3Key = `products/${productId}/${fileId}.${ext}`

  await uploadToS3(s3Key, finalBuffer, finalMimeType)

  const maxSortOrder = await prisma.productFile.aggregate({
    where: { productId },
    _max: { sortOrder: true },
  })

  const file = await prisma.productFile.create({
    data: {
      productId,
      filename: finalFilename,
      mimeType: finalMimeType,
      size: finalSize,
      s3Key,
      visibility,
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
    },
  })

  await logAudit({
    performedBy,
    action: 'PRODUCT_FILE_UPLOAD',
    targetType: 'Product',
    targetId: productId,
    metadata: {
      fileId: file.id,
      originalFilename: filename,
      finalFilename,
      originalSize: buffer.length,
      compressedSize: finalSize,
      compressionRatio: ((1 - finalSize / buffer.length) * 100).toFixed(1) + '%',
    },
  })

  return file
}

export const getProductFiles = async (productId: string, includeAdmin: boolean = false) => {
  const where: any = { productId }

  if (!includeAdmin) {
    where.visibility = 'PUBLIC'
  }

  const files = await prisma.productFile.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  })

  return Promise.all(
    files.map(async (file) => ({
      ...file,
      url: await getSignedDownloadUrl(file.s3Key),
    }))
  )
}

export const deleteProductFile = async (
  productId: string,
  fileId: string,
  performedBy: string,
  _request?: FastifyRequest
) => {
  const file = await prisma.productFile.findFirst({
    where: { id: fileId, productId },
  })

  if (!file) {
    throw { statusCode: 404, message: 'Fichier introuvable', code: 'NOT_FOUND' }
  }

  await deleteFromS3(file.s3Key)

  await prisma.productFile.delete({ where: { id: fileId } })

  await logAudit({
    performedBy,
    action: 'PRODUCT_FILE_DELETE',
    targetType: 'Product',
    targetId: productId,
    metadata: { fileId, filename: file.filename },
  })
}

export const reorderProductFiles = async (
  productId: string,
  fileIds: string[],
  performedBy: string,
  _request?: FastifyRequest
) => {
  const files = await prisma.productFile.findMany({
    where: { productId },
  })

  const fileIdSet = new Set(files.map((f) => f.id))

  for (const id of fileIds) {
    if (!fileIdSet.has(id)) {
      throw { statusCode: 400, message: 'ID de fichier invalide dans la liste', code: 'VALIDATION_ERROR' }
    }
  }

  await prisma.$transaction(
    fileIds.map((id, index) =>
      prisma.productFile.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  )

  await logAudit({
    performedBy,
    action: 'PRODUCT_UPDATE',
    targetType: 'Product',
    targetId: productId,
    metadata: { reorderedFiles: fileIds },
  })
}

export const setFileVisibility = async (
  productId: string,
  fileId: string,
  visibility: FileVisibility,
  performedBy: string,
  _request?: FastifyRequest
) => {
  const file = await prisma.productFile.findFirst({
    where: { id: fileId, productId },
  })

  if (!file) {
    throw { statusCode: 404, message: 'Fichier introuvable', code: 'NOT_FOUND' }
  }

  const updated = await prisma.productFile.update({
    where: { id: fileId },
    data: { visibility },
  })

  await logAudit({
    performedBy,
    action: 'PRODUCT_UPDATE',
    targetType: 'Product',
    targetId: productId,
    metadata: { fileId, visibility },
  })

  return updated
}

export const renameProductFile = async (
  productId: string,
  fileId: string,
  newFilename: string,
  performedBy: string,
  _request?: FastifyRequest
) => {
  const file = await prisma.productFile.findFirst({
    where: { id: fileId, productId },
  })

  if (!file) {
    throw { statusCode: 404, message: 'Fichier introuvable', code: 'NOT_FOUND' }
  }

  const updated = await prisma.productFile.update({
    where: { id: fileId },
    data: { filename: newFilename },
  })

  await logAudit({
    performedBy,
    action: 'PRODUCT_UPDATE',
    targetType: 'Product',
    targetId: productId,
    metadata: { fileId, oldFilename: file.filename, newFilename },
  })

  return {
    ...updated,
    url: await getSignedDownloadUrl(updated.s3Key),
  }
}
