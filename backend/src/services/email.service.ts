import nodemailer, { Transporter } from 'nodemailer'
import Handlebars from 'handlebars'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'
import * as settingsService from './settings.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cached transporter and config
let cachedTransporter: Transporter | null = null
let cachedFromAddress: string | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 60000 // 1 minute cache

// Get or create transporter with DB settings fallback to env
const getTransporter = async (): Promise<{ transporter: Transporter; fromAddress: string }> => {
  const now = Date.now()

  // Return cached transporter if still valid
  if (cachedTransporter && cachedFromAddress && (now - cacheTimestamp) < CACHE_TTL) {
    return { transporter: cachedTransporter, fromAddress: cachedFromAddress }
  }

  // Try to get settings from DB first
  const dbSettings = await settingsService.getSmtpSettings()

  // Determine which settings to use (DB if configured, else env)
  const useDbSettings = dbSettings.smtpHost && dbSettings.smtpHost.length > 0

  const host = useDbSettings ? dbSettings.smtpHost : env.SMTP_HOST
  const port = useDbSettings ? dbSettings.smtpPort : env.SMTP_PORT
  const secure = useDbSettings ? dbSettings.smtpSecure : env.SMTP_SECURE
  const user = useDbSettings ? dbSettings.smtpUser : env.SMTP_USER
  const pass = useDbSettings ? dbSettings.smtpPassword : env.SMTP_PASS

  // Build from address
  const fromName = useDbSettings && dbSettings.fromName ? dbSettings.fromName : 'Thales App'
  const fromEmail = useDbSettings && dbSettings.fromEmail ? dbSettings.fromEmail : env.SMTP_FROM
  const fromAddress = `"${fromName}" <${fromEmail}>`

  // Create transporter
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  })

  // Cache the transporter
  cachedTransporter = transporter
  cachedFromAddress = fromAddress
  cacheTimestamp = now

  logger.debug({ useDbSettings, host, port }, 'Email transporter configured')

  return { transporter, fromAddress }
}

// Clear transporter cache (called when settings are updated)
export const clearTransporterCache = (): void => {
  cachedTransporter = null
  cachedFromAddress = null
  cacheTimestamp = 0
}

// Register Handlebars helpers
Handlebars.registerHelper('eq', function (a, b) {
  return a === b
})

Handlebars.registerHelper('ifCond', function (this: any, a, operator, b, options) {
  switch (operator) {
    case '==':
      return a == b ? options.fn(this) : options.inverse(this)
    case '!=':
      return a != b ? options.fn(this) : options.inverse(this)
    case '===':
      return a === b ? options.fn(this) : options.inverse(this)
    case '!==':
      return a !== b ? options.fn(this) : options.inverse(this)
    case '<':
      return a < b ? options.fn(this) : options.inverse(this)
    case '<=':
      return a <= b ? options.fn(this) : options.inverse(this)
    case '>':
      return a > b ? options.fn(this) : options.inverse(this)
    case '>=':
      return a >= b ? options.fn(this) : options.inverse(this)
    default:
      return options.inverse(this)
  }
})

// Template cache
const templateCache = new Map<string, HandlebarsTemplateDelegate>()

// Load and compile template
const loadTemplate = (templateName: string): HandlebarsTemplateDelegate => {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!
  }

  const templatePath = join(__dirname, '..', 'email-templates', `${templateName}.hbs`)
  const templateSource = readFileSync(templatePath, 'utf-8')
  const template = Handlebars.compile(templateSource)

  templateCache.set(templateName, template)
  return template
}

// Render email with base template
const renderEmail = (templateName: string, data: any, headerTitle: string): string => {
  const contentTemplate = loadTemplate(templateName)
  const content = contentTemplate(data)

  const baseTemplate = loadTemplate('base')
  return baseTemplate({
    headerTitle,
    content,
  })
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<void> => {
  try {
    const { transporter, fromAddress } = await getTransporter()
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    })
    logger.info({ to, subject }, 'Email sent')
  } catch (error) {
    logger.error({ error, to, subject }, 'Failed to send email')
    // Don't throw - email failures should not block operations
  }
}

export const sendPasswordResetEmail = async (
  email: string,
  token: string,
  firstName: string
): Promise<void> => {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`

  const html = renderEmail(
    'password-reset',
    {
      firstName,
      resetUrl,
    },
    'Réinitialisation de mot de passe'
  )

  await sendEmail({
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    html,
  })
}

export const sendAccountActivatedEmail = async (
  email: string,
  firstName: string
): Promise<void> => {
  const loginUrl = `${env.FRONTEND_URL}/login`

  const html = renderEmail(
    'account-activated',
    {
      firstName,
      loginUrl,
    },
    'Compte activé'
  )

  await sendEmail({
    to: email,
    subject: 'Votre compte a été activé',
    html,
  })
}

export const sendInvitationEmail = async (
  email: string,
  token: string,
  inviterName: string
): Promise<void> => {
  const invitationUrl = `${env.FRONTEND_URL}/complete-registration?token=${token}`
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')

  const html = renderEmail(
    'invitation',
    {
      inviterName,
      invitationUrl,
      expiresAt,
    },
    'Vous êtes invité !'
  )

  await sendEmail({
    to: email,
    subject: 'Vous êtes invité à rejoindre la plateforme',
    html,
  })
}

// Reservation emails
interface ReservationEmailData {
  firstName: string
  lastName: string
  productName: string
  productReference?: string
  startDate: string
  endDate: string
  duration: number
  creditsCharged: number
  reservationId: string
  notes?: string
}

export const sendReservationConfirmedEmail = async (
  email: string,
  data: ReservationEmailData
): Promise<void> => {
  const html = renderEmail(
    'reservation-confirmed',
    {
      ...data,
      frontendUrl: env.FRONTEND_URL,
    },
    'Réservation confirmée'
  )

  await sendEmail({
    to: email,
    subject: `Réservation confirmée - ${data.productName}`,
    html,
  })
}

export const sendReservationCancelledEmail = async (
  email: string,
  data: ReservationEmailData & { cancelReason?: string }
): Promise<void> => {
  const html = renderEmail(
    'reservation-cancelled',
    {
      ...data,
      frontendUrl: env.FRONTEND_URL,
    },
    'Réservation annulée'
  )

  await sendEmail({
    to: email,
    subject: `Réservation annulée - ${data.productName}`,
    html,
  })
}

export const sendReservationCancelledMaintenanceEmail = async (
  email: string,
  data: ReservationEmailData & { refundAmount: number; newBalance: number; maintenanceReason?: string }
): Promise<void> => {
  const html = renderEmail(
    'reservation-cancelled-maintenance',
    {
      ...data,
      frontendUrl: env.FRONTEND_URL,
    },
    'Réservation annulée (maintenance)'
  )

  await sendEmail({
    to: email,
    subject: `Réservation annulée (maintenance) - ${data.productName}`,
    html,
  })
}

export const sendReservationRefundedEmail = async (
  email: string,
  data: ReservationEmailData & { refundAmount: number; newBalance: number; adminNotes?: string }
): Promise<void> => {
  const html = renderEmail(
    'reservation-refunded',
    {
      ...data,
      frontendUrl: env.FRONTEND_URL,
    },
    'Réservation remboursée'
  )

  await sendEmail({
    to: email,
    subject: `Remboursement effectué - ${data.productName}`,
    html,
  })
}

export const sendCheckoutCompletedEmail = async (
  email: string,
  data: ReservationEmailData & { checkedOutAt: string }
): Promise<void> => {
  const html = renderEmail(
    'checkout-completed',
    {
      ...data,
      frontendUrl: env.FRONTEND_URL,
    },
    'Retrait confirmé'
  )

  await sendEmail({
    to: email,
    subject: `Matériel retiré - ${data.productName}`,
    html,
  })
}

export const sendReturnCompletedEmail = async (
  email: string,
  data: ReservationEmailData & {
    returnedAt: string
    condition: string
    hasPhotos?: boolean
    photoCount?: number
  }
): Promise<void> => {
  const html = renderEmail(
    'return-completed',
    {
      ...data,
      frontendUrl: env.FRONTEND_URL,
    },
    'Retour confirmé'
  )

  await sendEmail({
    to: email,
    subject: `Retour confirmé - ${data.productName}`,
    html,
  })
}

export const sendReservationReminderEmail = async (
  email: string,
  data: ReservationEmailData
): Promise<void> => {
  const html = renderEmail(
    'reservation-reminder',
    {
      ...data,
      frontendUrl: env.FRONTEND_URL,
    },
    'Rappel de réservation'
  )

  await sendEmail({
    to: email,
    subject: `Rappel : Votre réservation commence demain - ${data.productName}`,
    html,
  })
}

// Credit emails
interface CreditEmailData {
  firstName: string
  lastName: string
  amount: number
  newBalance: number
  reason?: string
}

export const sendCreditAddedEmail = async (
  email: string,
  data: CreditEmailData
): Promise<void> => {
  const html = renderEmail(
    'credit-added',
    {
      ...data,
      frontendUrl: env.FRONTEND_URL,
    },
    'Crédits ajoutés'
  )

  await sendEmail({
    to: email,
    subject: `Crédits ajoutés à votre compte (+${data.amount})`,
    html,
  })
}

export const sendCreditRemovedEmail = async (
  email: string,
  data: CreditEmailData
): Promise<void> => {
  const html = renderEmail(
    'credit-removed',
    {
      ...data,
      frontendUrl: env.FRONTEND_URL,
    },
    'Crédits retirés'
  )

  await sendEmail({
    to: email,
    subject: `Crédits retirés de votre compte (${data.amount})`,
    html,
  })
}

// Extension emails
interface ExtensionEmailData {
  firstName: string
  lastName: string
  productName: string
  reservationId: string
}

export const sendExtensionConfirmedEmail = async (
  email: string,
  data: ExtensionEmailData & { newEndDate: string; cost: number }
): Promise<void> => {
  const html = renderEmail(
    'extension-confirmed',
    {
      ...data,
      frontendUrl: env.FRONTEND_URL,
    },
    'Réservation prolongée'
  )

  await sendEmail({
    to: email,
    subject: `Réservation prolongée - ${data.productName}`,
    html,
  })
}

// Overdue and expired emails
export const sendReservationOverdueEmail = async (
  email: string,
  data: {
    firstName: string
    lastName: string
    productName: string
    endDate: string
    daysOverdue: number
    reservationId: string
  }
): Promise<void> => {
  const html = renderEmail(
    'reservation-overdue',
    {
      ...data,
      frontendUrl: env.FRONTEND_URL,
    },
    'Retour en retard'
  )

  await sendEmail({
    to: email,
    subject: `⚠️ Retour en retard - ${data.productName}`,
    html,
  })
}

export const sendReservationExpiredEmail = async (
  email: string,
  data: {
    firstName: string
    lastName: string
    productName: string
    startDate: string
    endDate: string
    reservationId: string
  }
): Promise<void> => {
  const html = renderEmail(
    'reservation-expired',
    {
      ...data,
      frontendUrl: env.FRONTEND_URL,
    },
    'Réservation expirée'
  )

  await sendEmail({
    to: email,
    subject: `Réservation expirée - ${data.productName}`,
    html,
  })
}

export const sendPasswordChangedEmail = async (
  email: string,
  data: {
    firstName: string
    lastName: string
  }
): Promise<void> => {
  const html = renderEmail(
    'password-changed',
    {
      ...data,
    },
    'Mot de passe modifié'
  )

  await sendEmail({
    to: email,
    subject: 'Votre mot de passe a été modifié',
    html,
  })
}