// src/schemas/invitation.ts

import { z } from 'zod'

export const createInvitationSchema = z.object({
  email: z.string().email('Invalid email format'),
})

export const completeRegistrationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  gdprConsent: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
})

export const validateInvitationTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>
export type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>
