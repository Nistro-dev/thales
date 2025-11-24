// src/services/subsection.service.ts

import { prisma } from '../utils/prisma.js'
import { logAudit } from './audit.service.js'
import { getDefaultSection } from './section.service.js'
import { FastifyRequest } from 'fastify'

export const listOrphanSubSections = async () => {
  return prisma.subSection.findMany({
    where: { sectionId: null },
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export const getSubSectionById = async (id: string) => {
  const subSection = await prisma.subSection.findUnique({
    where: { id },
    include: {
      section: true,
      _count: { select: { products: true } },
    },
  })

  if (!subSection) {
    throw { statusCode: 404, message: 'SubSection not found', code: 'NOT_FOUND' }
  }

  return subSection
}

interface CreateSubSectionInput {
  name: string
  description?: string
  sectionId: string
  sortOrder?: number
}

export const createSubSection = async (
  data: CreateSubSectionInput,
  performedBy: string,
  request?: FastifyRequest
) => {
  const section = await prisma.section.findUnique({ where: { id: data.sectionId } })

  if (!section) {
    throw { statusCode: 404, message: 'Section not found', code: 'NOT_FOUND' }
  }

  const subSection = await prisma.subSection.create({
    data: {
      name: data.name,
      description: data.description,
      sectionId: data.sectionId,
      sortOrder: data.sortOrder ?? 0,
    },
  })

  await logAudit({
    performedBy,
    action: 'SUBSECTION_CREATE',
    targetType: 'SubSection',
    targetId: subSection.id,
    metadata: { name: data.name, sectionId: data.sectionId },
  })

  return subSection
}

interface UpdateSubSectionInput {
  name?: string
  description?: string
  sectionId?: string
  sortOrder?: number
}

export const updateSubSection = async (
  id: string,
  data: UpdateSubSectionInput,
  performedBy: string,
  request?: FastifyRequest
) => {
  const subSection = await prisma.subSection.findUnique({ where: { id } })

  if (!subSection) {
    throw { statusCode: 404, message: 'SubSection not found', code: 'NOT_FOUND' }
  }

  if (data.sectionId) {
    const section = await prisma.section.findUnique({ where: { id: data.sectionId } })
    if (!section) {
      throw { statusCode: 404, message: 'Target section not found', code: 'NOT_FOUND' }
    }
  }

  const updated = await prisma.subSection.update({
    where: { id },
    data,
  })

  await logAudit({
    performedBy,
    action: 'SUBSECTION_UPDATE',
    targetType: 'SubSection',
    targetId: id,
    metadata: data,
  })

  return updated
}

export const deleteSubSection = async (
  id: string,
  performedBy: string,
  request?: FastifyRequest
) => {
  const subSection = await prisma.subSection.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  })

  if (!subSection) {
    throw { statusCode: 404, message: 'SubSection not found', code: 'NOT_FOUND' }
  }

  const defaultSection = await getDefaultSection()

  if (!defaultSection) {
    throw { statusCode: 500, message: 'Default section not found', code: 'INTERNAL_ERROR' }
  }

  await prisma.$transaction([
    prisma.product.updateMany({
      where: { subSectionId: id },
      data: { sectionId: defaultSection.id, subSectionId: null },
    }),
    prisma.subSection.delete({ where: { id } }),
  ])

  await logAudit({
    performedBy,
    action: 'SUBSECTION_DELETE',
    targetType: 'SubSection',
    targetId: id,
    metadata: {
      name: subSection.name,
      movedProducts: subSection._count.products,
      movedToSection: defaultSection.id,
    },
  })
}
