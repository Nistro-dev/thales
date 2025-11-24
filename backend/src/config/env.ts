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
  SMTP_SECURE: z.string().transform((v) => v === 'true').default('false'),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM: z.string(),
  
  S3_ENDPOINT: z.string(),
  S3_BUCKET: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_REGION: z.string().default('us-east-1'),
  
  FRONTEND_URL: z.string(),
  API_URL: z.string(),
})

export const env = envSchema.parse(process.env)