import jwt, { SignOptions } from 'jsonwebtoken'
import { env } from '../config/env.js'

interface TokenPayload {
  userId: string
  email: string
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  }
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options)
}

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  }
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options)
}

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload
}

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload
}

export const getRefreshTokenExpiry = (): Date => {
  const match = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([dhms])$/)
  if (!match) throw new Error('Invalid JWT_REFRESH_EXPIRES_IN format')

  const value = parseInt(match[1])
  const unit = match[2]

  const ms: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }

  return new Date(Date.now() + value * ms[unit])
}