// src/services/section.service.ts

import { prisma } from '../utils/prisma.js'
import { logAudit } from './audit.service.js'
import { FastifyRequest } from 'fastify'

const DEFAULT_SECTION_NAME = 'Autres'

export const getDefaultSection = async () => {
  return prisma.section.findFirst({
    where: { isSystem: true, name: DEFAULT_SECTION_NAME },
  })
}

export const listSections = async (includeSystem: boolean = false) => {
  const where = includeSystem ? {} : { isSystem: false }

  return prisma.section.findMany({
    where,
    include: {
      subSections: {
        orderBy: { sortOrder: 'asc' },
      },
      _count: { select: { products: true } },
    },
    orderBy: { sortOrder: 'asc' },
  })
}

export const getSectionById = async (id: string) => {
  const section = await prisma.section.findUnique({
    where: { id },
    include: {
      subSections: {
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { products: true } },
        },
      },
      _count: { select: { products: true } },
    },
  })

  if (!section) {
    throw { statusCode: 404, message: 'Section introuvable', code: 'NOT_FOUND' }
  }

  return section
}

interface CreateSectionInput {
  name: string
  description?: string
  allowedDaysIn?: number[]
  allowedDaysOut?: number[]
  sortOrder?: number
}

export const createSection = async (
  data: CreateSectionInput,
  performedBy: string,
  _request?: FastifyRequest
) => {
  const section = await prisma.section.create({
    data: {
      name: data.name,
      description: data.description,
      allowedDaysIn: data.allowedDaysIn ?? [1, 2, 3, 4, 5],
      allowedDaysOut: data.allowedDaysOut ?? [1, 2, 3, 4, 5],
      sortOrder: data.sortOrder ?? 0,
    },
  })

  await logAudit({
    performedBy,
    action: 'SECTION_CREATE',
    targetType: 'Section',
    targetId: section.id,
    metadata: { name: data.name },
  })

  return section
}

export const updateSection = async (
  id: string,
  data: Partial<CreateSectionInput>,
  performedBy: string,
  _request?: FastifyRequest
) => {
  const section = await prisma.section.findUnique({ where: { id } })

  if (!section) {
    throw { statusCode: 404, message: 'Section introuvable', code: 'NOT_FOUND' }
  }

  if (section.isSystem) {
    throw { statusCode: 403, message: 'Impossible de modifier une section système', code: 'FORBIDDEN' }
  }

  const updated = await prisma.section.update({
    where: { id },
    data,
  })

  await logAudit({
    performedBy,
    action: 'SECTION_UPDATE',
    targetType: 'Section',
    targetId: id,
    metadata: data,
  })

  return updated
}

export const deleteSection = async (id: string, performedBy: string, _request?: FastifyRequest) => {
  const section = await prisma.section.findUnique({
    where: { id },
    include: {
      subSections: true,
      _count: { select: { products: true } },
    },
  })

  if (!section) {
    throw { statusCode: 404, message: 'Section introuvable', code: 'NOT_FOUND' }
  }

  if (section.isSystem) {
    throw { statusCode: 403, message: 'Impossible de supprimer une section système', code: 'FORBIDDEN' }
  }

  // Get default "Autres" section
  const defaultSection = await getDefaultSection()
  if (!defaultSection) {
    throw { statusCode: 500, message: 'Section par défaut "Autres" introuvable', code: 'INTERNAL_ERROR' }
  }

  // Move direct products to "Autres" section
  const movedProductsCount = await prisma.product.updateMany({
    where: { sectionId: id },
    data: {
      sectionId: defaultSection.id,
      subSectionId: null,
    },
  })

  // Make subsections orphans (set sectionId to null)
  await prisma.subSection.updateMany({
    where: { sectionId: id },
    data: { sectionId: null },
  })

  // Delete the section
  await prisma.section.delete({ where: { id } })

  await logAudit({
    performedBy,
    action: 'SECTION_DELETE',
    targetType: 'Section',
    targetId: id,
    metadata: {
      name: section.name,
      movedProducts: movedProductsCount.count,
      orphanedSubSections: section.subSections.length,
    },
  })
}