import type {
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginationParams,
  PaginationMeta,
  ErrorCode,
} from '../types/api.js'

/**
 * Crée une réponse de succès standardisée
 */
export function createSuccessResponse<T>(
  message: string,
  data: T,
  pagination?: PaginationParams
): ApiSuccessResponse<T> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  if (pagination) {
    response.meta.pagination = createPaginationMeta(pagination)
  }

  return response
}

/**
 * Crée une réponse d'erreur standardisée
 */
export function createErrorResponse(
  message: string,
  code: ErrorCode,
  details?: any
): ApiErrorResponse {
  return {
    success: false,
    message,
    error: {
      code,
      ...(details && { details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  }
}

/**
 * Crée les métadonnées de pagination
 */
function createPaginationMeta(params: PaginationParams): PaginationMeta {
  const { page, limit, total } = params
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

/**
 * Messages de succès standards
 */
export const SuccessMessages = {
  // Auth
  LOGIN_SUCCESS: 'Connexion réussie',
  LOGOUT_SUCCESS: 'Déconnexion réussie',
  LOGOUT_ALL_SUCCESS: 'Déconnexion de tous les appareils réussie',
  TOKEN_REFRESHED: 'Token rafraîchi avec succès',
  PASSWORD_RESET_REQUESTED: 'Un email de réinitialisation a été envoyé',
  PASSWORD_RESET_SUCCESS: 'Mot de passe réinitialisé avec succès',

  // Invitations
  INVITATION_CREATED: 'Invitation créée avec succès',
  INVITATION_CANCELLED: 'Invitation annulée avec succès',
  INVITATIONS_RETRIEVED: 'Invitations récupérées avec succès',
  REGISTRATION_COMPLETED: 'Inscription complétée avec succès',

  // Files
  FILE_UPLOADED: 'Fichier uploadé avec succès',
  FILE_DELETED: 'Fichier supprimé avec succès',
  FILES_RETRIEVED: 'Fichiers récupérés avec succès',

  // Users
  USER_CREATED: 'Utilisateur créé avec succès',
  USER_UPDATED: 'Utilisateur mis à jour avec succès',
  USER_DELETED: 'Utilisateur supprimé avec succès',
  USERS_RETRIEVED: 'Utilisateurs récupérés avec succès',
  USER_STATUS_CHANGED: 'Statut utilisateur modifié avec succès',

  // Credits
  CREDITS_ADJUSTED: 'Crédits ajustés avec succès',
  CREDIT_TRANSACTIONS_RETRIEVED: 'Historique des transactions récupéré avec succès',

  // Caution
  CAUTION_VALIDATED: 'Caution validée avec succès',
  CAUTION_EXEMPTED: 'Caution exemptée avec succès',
  CAUTION_RESET: 'Caution réinitialisée avec succès',

  // Roles
  ROLE_CREATED: 'Rôle créé avec succès',
  ROLE_UPDATED: 'Rôle mis à jour avec succès',
  ROLE_DELETED: 'Rôle supprimé avec succès',
  ROLES_RETRIEVED: 'Rôles récupérés avec succès',
  ROLE_ASSIGNED: 'Rôle assigné avec succès',
  ROLE_REVOKED: 'Rôle révoqué avec succès',
  USER_ROLES_RETRIEVED: 'Rôles utilisateur récupérés avec succès',

  // Permissions
  PERMISSIONS_RETRIEVED: 'Permissions récupérées avec succès',

  // Reservations
  RESERVATION_CREATED: 'Réservation créée avec succès',
  RESERVATION_CANCELLED: 'Réservation annulée avec succès',
  RESERVATION_UPDATED: 'Réservation mise à jour avec succès',
  RESERVATION_REFUNDED: 'Réservation remboursée avec succès',
  PRODUCT_CHECKED_OUT: 'Produit sorti avec succès',
  PRODUCT_RETURNED: 'Produit retourné avec succès',

  // Generic
  RETRIEVED: 'Données récupérées avec succès',
  CREATED: 'Créé avec succès',
  UPDATED: 'Mis à jour avec succès',
  DELETED: 'Supprimé avec succès',
} as const

/**
 * Messages d'erreur standards
 */
export const ErrorMessages = {
  // Auth
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
  ACCOUNT_SUSPENDED: 'Votre compte a été suspendu',
  ACCOUNT_DISABLED: 'Votre compte a été désactivé',
  INVALID_TOKEN: 'Token invalide',
  TOKEN_EXPIRED: 'Token expiré',
  UNAUTHORIZED: 'Non autorisé',
  FORBIDDEN: 'Accès interdit',
  NO_REFRESH_TOKEN: 'Aucun token de rafraîchissement fourni',

  // Resources
  NOT_FOUND: 'Ressource non trouvée',
  USER_NOT_FOUND: 'Utilisateur non trouvé',
  INVITATION_NOT_FOUND: 'Invitation non trouvée',
  FILE_NOT_FOUND: 'Fichier non trouvé',
  ALREADY_EXISTS: 'Cette ressource existe déjà',
  USER_ALREADY_EXISTS: 'Un utilisateur avec cet email existe déjà',

  // Validation
  VALIDATION_ERROR: 'Erreur de validation',
  MISSING_FIELD: 'Champ requis manquant',
  INVALID_FORMAT: 'Format invalide',
  INVALID_EMAIL: 'Format d\'email invalide',
  PASSWORD_TOO_WEAK: 'Le mot de passe doit contenir au moins 8 caractères',
  GDPR_CONSENT_REQUIRED: 'Le consentement GDPR est requis',

  // Invitations
  INVITATION_EXPIRED: 'Cette invitation a expiré',
  INVITATION_ALREADY_USED: 'Cette invitation a déjà été utilisée',
  INVITATION_INVALID: 'Token d\'invitation invalide',
  CANNOT_CANCEL_USED_INVITATION: 'Impossible d\'annuler une invitation déjà utilisée',

  // Password Reset
  RESET_TOKEN_INVALID: 'Token de réinitialisation invalide ou expiré',
  RESET_TOKEN_USED: 'Ce lien de réinitialisation a déjà été utilisé',
  RESET_TOKEN_EXPIRED: 'Ce lien de réinitialisation a expiré',

  // Reservations
  RESERVATION_NOT_FOUND: 'Réservation non trouvée',
  PRODUCT_NOT_AVAILABLE: 'Produit non disponible à la réservation',
  INSUFFICIENT_CREDITS: 'Crédits insuffisants',
  INVALID_DATES: 'Dates invalides',
  RESERVATION_CONFLICT: 'Le produit est déjà réservé pour cette période',
  CAUTION_REQUIRED: 'Caution requise pour effectuer une réservation',
  CANNOT_CANCEL: 'Impossible d\'annuler cette réservation',
  ALREADY_REFUNDED: 'Cette réservation a déjà été remboursée',

  // Server
  INTERNAL_ERROR: 'Erreur interne du serveur',
  DATABASE_ERROR: 'Erreur de base de données',
  SERVICE_UNAVAILABLE: 'Service temporairement indisponible',
} as const
