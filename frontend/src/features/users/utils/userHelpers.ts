import type { UserStatus, CautionStatus } from "@/api/users.api";

export function getUserStatusLabel(status: UserStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Actif";
    case "SUSPENDED":
      return "Suspendu";
    case "DISABLED":
      return "Désactivé";
    default:
      return status;
  }
}

export function getUserStatusColor(status: UserStatus): string {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "SUSPENDED":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    case "DISABLED":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
}

export function getCautionStatusLabel(status: CautionStatus): string {
  switch (status) {
    case "PENDING":
      return "En attente";
    case "VALIDATED":
      return "Validée";
    case "EXEMPTED":
      return "Exempté";
    default:
      return status;
  }
}

export function getCautionStatusColor(status: CautionStatus): string {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "VALIDATED":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "EXEMPTED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
}

export function formatUserName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getCreditTransactionTypeLabel(type: string): string {
  switch (type) {
    case "INITIAL":
      return "Crédits initiaux";
    case "ADJUSTMENT":
      return "Ajustement";
    case "RESERVATION":
      return "Réservation";
    case "REFUND":
      return "Remboursement";
    case "EXTENSION":
      return "Extension";
    case "PENALTY":
      return "Pénalité";
    default:
      return type;
  }
}

export function getCreditTransactionTypeColor(type: string): string {
  switch (type) {
    case "INITIAL":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "ADJUSTMENT":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "RESERVATION":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    case "REFUND":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "EXTENSION":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "PENALTY":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
}

export function getReservationStatusLabel(status: string): string {
  switch (status) {
    case "CONFIRMED":
      return "Confirmée";
    case "CHECKED_OUT":
      return "En cours";
    case "RETURNED":
      return "Terminée";
    case "CANCELLED":
      return "Annulée";
    case "REFUNDED":
      return "Remboursée";
    default:
      return status;
  }
}

export function getReservationStatusColor(status: string): string {
  switch (status) {
    case "CONFIRMED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "CHECKED_OUT":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "RETURNED":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "CANCELLED":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "REFUNDED":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
}
