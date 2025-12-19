import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),

  DATABASE_URL: z.string(),

  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform(Number),
  SMTP_SECURE: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM: z.string(),

  S3_ENDPOINT: z.string(),
  S3_BUCKET: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_REGION: z.string().default('us-east-1'),

  // Backup S3 configuration (can use same bucket with different prefix, or separate bucket)
  S3_BACKUP_BUCKET: z.string().optional(),
  BACKUP_RETENTION_DAYS: z.string().transform(Number).default('14'),
  BACKUP_CRON_ENABLED: z.string().transform((v) => v === 'true').default('true'),
  BACKUP_CRON_SCHEDULE: z.string().default('0 2 * * *'), // Default: 2am daily

  FRONTEND_URL: z.string(),
  API_URL: z.string(),

  GDPR_VERSION: z.string().default('1.0'),
  PASSWORD_RESET_EXPIRES_IN: z.string().default('1h'),
})

export const env = envSchema.parse(process.env)