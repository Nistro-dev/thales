// src/services/settings.service.ts

import { prisma } from '../utils/prisma.js'
import crypto from 'crypto'
import { env } from '../config/env.js'

// Encryption key derived from JWT secret (32 bytes for AES-256)
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(env.JWT_ACCESS_SECRET)
  .digest()

const ENCRYPTION_ALGORITHM = 'aes-256-gcm'

// Settings that should be encrypted (sensitive data)
const ENCRYPTED_SETTINGS = ['smtp_password']

// Default SMTP settings
const DEFAULT_SMTP_SETTINGS: SmtpSettings = {
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  smtpSecure: true,
  fromEmail: 'noreply@thales.local',
  fromName: 'Thales App',
  replyToEmail: '',
}

export interface SmtpSettings {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  smtpSecure: boolean
  fromEmail: string
  fromName: string
  replyToEmail: string
}

// Encrypt a value
const encrypt = (text: string): string => {
  if (!text) return ''
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // Return iv:authTag:encrypted as base64
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

// Decrypt a value
const decrypt = (encryptedText: string): string => {
  if (!encryptedText) return ''
  try {
    const [ivBase64, authTagBase64, encryptedBase64] = encryptedText.split(':')
    const iv = Buffer.from(ivBase64, 'base64')
    const authTag = Buffer.from(authTagBase64, 'base64')
    const encrypted = Buffer.from(encryptedBase64, 'base64')
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    return ''
  }
}

// Get a single setting by key
export const getSetting = async (key: string): Promise<string | null> => {
  const setting = await prisma.setting.findUnique({ where: { key } })
  if (!setting) return null
  return setting.encrypted ? decrypt(setting.value) : setting.value
}

// Set a single setting
export const setSetting = async (
  key: string,
  value: string,
  encrypted: boolean = false
): Promise<void> => {
  const finalValue = encrypted ? encrypt(value) : value
  await prisma.setting.upsert({
    where: { key },
    update: { value: finalValue, encrypted },
    create: { key, value: finalValue, encrypted },
  })
}

// Get multiple settings by prefix
export const getSettingsByPrefix = async (
  prefix: string
): Promise<Record<string, string>> => {
  const settings = await prisma.setting.findMany({
    where: { key: { startsWith: prefix } },
  })

  const result: Record<string, string> = {}
  for (const setting of settings) {
    const value = setting.encrypted ? decrypt(setting.value) : setting.value
    result[setting.key] = value
  }
  return result
}

// Get SMTP settings
export const getSmtpSettings = async (): Promise<SmtpSettings> => {
  const settings = await getSettingsByPrefix('smtp_')

  return {
    smtpHost: settings['smtp_host'] ?? DEFAULT_SMTP_SETTINGS.smtpHost,
    smtpPort: parseInt(settings['smtp_port'] ?? String(DEFAULT_SMTP_SETTINGS.smtpPort), 10),
    smtpUser: settings['smtp_user'] ?? DEFAULT_SMTP_SETTINGS.smtpUser,
    smtpPassword: settings['smtp_password'] ?? DEFAULT_SMTP_SETTINGS.smtpPassword,
    smtpSecure: settings['smtp_secure'] !== 'false',
    fromEmail: settings['smtp_from_email'] ?? DEFAULT_SMTP_SETTINGS.fromEmail,
    fromName: settings['smtp_from_name'] ?? DEFAULT_SMTP_SETTINGS.fromName,
    replyToEmail: settings['smtp_reply_to'] ?? DEFAULT_SMTP_SETTINGS.replyToEmail,
  }
}

// Save SMTP settings
export const saveSmtpSettings = async (settings: SmtpSettings): Promise<void> => {
  const operations = [
    setSetting('smtp_host', settings.smtpHost),
    setSetting('smtp_port', String(settings.smtpPort)),
    setSetting('smtp_user', settings.smtpUser),
    setSetting('smtp_secure', String(settings.smtpSecure)),
    setSetting('smtp_from_email', settings.fromEmail),
    setSetting('smtp_from_name', settings.fromName),
    setSetting('smtp_reply_to', settings.replyToEmail),
  ]

  // Only update password if it's not the placeholder
  if (settings.smtpPassword && settings.smtpPassword !== '••••••••') {
    operations.push(setSetting('smtp_password', settings.smtpPassword, true))
  }

  await Promise.all(operations)
}

// Get SMTP settings for API response (mask password)
export const getSmtpSettingsForApi = async (): Promise<SmtpSettings> => {
  const settings = await getSmtpSettings()
  return {
    ...settings,
    smtpPassword: settings.smtpPassword ? '••••••••' : '',
  }
}

// ============================================
// SECURITY SETTINGS
// ============================================

export interface SecuritySettings {
  accountInactivityDays: number
  accountInactivityEnabled: boolean
}

const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  accountInactivityDays: 730, // 2 years by default
  accountInactivityEnabled: true,
}

// Get security settings
export const getSecuritySettings = async (): Promise<SecuritySettings> => {
  const settings = await getSettingsByPrefix('security_')

  return {
    accountInactivityDays: parseInt(settings['security_account_inactivity_days'] ?? String(DEFAULT_SECURITY_SETTINGS.accountInactivityDays), 10),
    accountInactivityEnabled: settings['security_account_inactivity_enabled'] !== 'false',
  }
}

// Save security settings
export const saveSecuritySettings = async (settings: SecuritySettings): Promise<void> => {
  await Promise.all([
    setSetting('security_account_inactivity_days', String(settings.accountInactivityDays)),
    setSetting('security_account_inactivity_enabled', String(settings.accountInactivityEnabled)),
  ])
}

// ============================================
// MAINTENANCE SETTINGS
// ============================================

export interface MaintenanceSettings {
  maintenanceEnabled: boolean
  maintenanceMessage: string
}

const DEFAULT_MAINTENANCE_SETTINGS: MaintenanceSettings = {
  maintenanceEnabled: false,
  maintenanceMessage: 'L\'application est en maintenance. Veuillez réessayer plus tard.',
}

// Get maintenance settings
export const getMaintenanceSettings = async (): Promise<MaintenanceSettings> => {
  const settings = await getSettingsByPrefix('maintenance_')

  return {
    maintenanceEnabled: settings['maintenance_enabled'] === 'true',
    maintenanceMessage: settings['maintenance_message'] ?? DEFAULT_MAINTENANCE_SETTINGS.maintenanceMessage,
  }
}

// Save maintenance settings
export const saveMaintenanceSettings = async (settings: MaintenanceSettings): Promise<void> => {
  await Promise.all([
    setSetting('maintenance_enabled', String(settings.maintenanceEnabled)),
    setSetting('maintenance_message', settings.maintenanceMessage),
  ])
}

// ============================================
// SMTP TEST
// ============================================

// Test SMTP connection
export const testSmtpConnection = async (settings: SmtpSettings): Promise<{ success: boolean; error?: string }> => {
  const nodemailer = await import('nodemailer')

  // Use provided password or fetch from DB if placeholder
  let password = settings.smtpPassword
  if (password === '••••••••') {
    const currentSettings = await getSmtpSettings()
    password = currentSettings.smtpPassword
  }

  const transporter = nodemailer.default.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure,
    auth: {
      user: settings.smtpUser,
      pass: password,
    },
    connectionTimeout: 10000,
  })

  try {
    await transporter.verify()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de connexion SMTP',
    }
  } finally {
    transporter.close()
  }
}
