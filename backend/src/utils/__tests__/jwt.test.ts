import { describe, it, expect } from 'vitest'
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, getRefreshTokenExpiry } from '../jwt'

describe('JWT Utils', () => {
  const mockPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
  }

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3) // JWT has 3 parts
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3)
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(mockPayload)
      const decoded = verifyAccessToken(token)

      expect(decoded.userId).toBe(mockPayload.userId)
      expect(decoded.email).toBe(mockPayload.email)
    })

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow()
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload)
      const decoded = verifyRefreshToken(token)

      expect(decoded.userId).toBe(mockPayload.userId)
      expect(decoded.email).toBe(mockPayload.email)
    })

    it('should throw error for invalid token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow()
    })
  })

  describe('getRefreshTokenExpiry', () => {
    it('should return a future date', () => {
      const expiryDate = getRefreshTokenExpiry()
      const now = new Date()

      expect(expiryDate).toBeInstanceOf(Date)
      expect(expiryDate.getTime()).toBeGreaterThan(now.getTime())
    })

    it('should calculate correct expiry for days', () => {
      const expiryDate = getRefreshTokenExpiry()
      const now = new Date()
      const diffInDays = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      expect(diffInDays).toBeGreaterThanOrEqual(6)
      expect(diffInDays).toBeLessThanOrEqual(7)
    })
  })
})