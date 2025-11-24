import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../../utils/password'

const prisma = new PrismaClient()

describe('User Model', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-user-model',
        },
      },
    })
  })

  afterAll(async () => {
    // Clean up after tests
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-user-model',
        },
      },
    })
    await prisma.$disconnect()
  })

  it('should create a user', async () => {
    const hashedPassword = await hashPassword('password123')
    const user = await prisma.user.create({
      data: {
        email: 'test-user-model-create@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
      },
    })

    expect(user).toBeDefined()
    expect(user.id).toBeDefined()
    expect(user.email).toBe('test-user-model-create@example.com')
    expect(user.firstName).toBe('Test')
    expect(user.lastName).toBe('User')
    expect(user.password).not.toBe('password123')
  })

  it('should find a user by email', async () => {
    const hashedPassword = await hashPassword('password123')
    await prisma.user.create({
      data: {
        email: 'test-user-model-find@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
      },
    })

    const user = await prisma.user.findUnique({
      where: {
        email: 'test-user-model-find@example.com',
      },
    })

    expect(user).toBeDefined()
    expect(user?.email).toBe('test-user-model-find@example.com')
  })

  it('should update a user', async () => {
    const hashedPassword = await hashPassword('password123')
    const user = await prisma.user.create({
      data: {
        email: 'test-user-model-update@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
      },
    })

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        firstName: 'Updated',
      },
    })

    expect(updatedUser.firstName).toBe('Updated')
  })

  it('should delete a user', async () => {
    const hashedPassword = await hashPassword('password123')
    const user = await prisma.user.create({
      data: {
        email: 'test-user-model-delete@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
      },
    })

    await prisma.user.delete({
      where: {
        id: user.id,
      },
    })

    const deletedUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    })

    expect(deletedUser).toBeNull()
  })

  it('should enforce unique email constraint', async () => {
    const hashedPassword = await hashPassword('password123')
    await prisma.user.create({
      data: {
        email: 'test-user-model-unique@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
      },
    })

    await expect(
      prisma.user.create({
        data: {
          email: 'test-user-model-unique@example.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
        },
      })
    ).rejects.toThrow()
  })
})