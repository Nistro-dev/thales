import { api } from './api'
import type { Invitation, CompleteRegistrationData } from '@/types'

interface ValidateInvitationResponse {
  valid: boolean
  email?: string
  inviterName?: string
}

interface CreateInvitationResponse {
  invitation: Invitation
}

interface CompleteRegistrationResponse {
  message: string
  user?: unknown
}

export const invitationService = {
  async createInvitation(email: string): Promise<CreateInvitationResponse> {
    return api.post<CreateInvitationResponse>('/invitations', { email })
  },

  async validateInvitationToken(token: string): Promise<ValidateInvitationResponse> {
    return api.get<ValidateInvitationResponse>(`/invitations/validate?token=${encodeURIComponent(token)}`, { skipAuth: true })
  },

  async completeRegistration(data: CompleteRegistrationData & { token: string }): Promise<CompleteRegistrationResponse> {
    return api.post<CompleteRegistrationResponse>('/invitations/complete', data, { skipAuth: true })
  },

  async listPendingInvitations(): Promise<Invitation[]> {
    return api.get<Invitation[]>('/invitations/pending')
  },

  async cancelInvitation(id: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/invitations/${id}`)
  },
}

export default invitationService