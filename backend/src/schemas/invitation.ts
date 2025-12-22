// src/schemas/invitation.ts

import { z } from 'zod'

export const createInvitationSchema = z.object({
  email: z.string().email("Format d'email invalide"),
})

export const completeRegistrationSchema = z.object({
  token: z.string().min(1, 'Le token est requis'),
  firstName: z.string().min(1, 'Le prénom est requis').max(50),
  lastName: z.string().min(1, 'Le nom est requis').max(50),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  gdprConsent: z.boolean().refine((val) => val === true, {
    message: 'Vous devez accepter les conditions générales',
  }),
})

export const validateInvitationTokenSchema = z.object({
  token: z.string().min(1, 'Le token est requis'),
})

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>
export type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>
