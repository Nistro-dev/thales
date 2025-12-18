import {
  LayoutDashboard,
  Users,
  CreditCard,
  Shield,
  Mail,
  FileText,
  FolderTree,
  Package,
  Calendar,
  BarChart3,
  ShieldAlert,
  Settings,
  Wrench,
  type LucideIcon,
} from "lucide-react";

// Permission categories with labels, icons, and permissions
export interface PermissionCategory {
  key: string;
  label: string;
  icon: LucideIcon;
  permissions: string[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    key: "admin",
    label: "Panneau d'administration",
    icon: LayoutDashboard,
    permissions: ["VIEW_ADMIN_PANEL"],
  },
  {
    key: "users",
    label: "Utilisateurs",
    icon: Users,
    permissions: ["VIEW_USERS", "MANAGE_USERS"],
  },
  {
    key: "credits",
    label: "Crédits",
    icon: CreditCard,
    permissions: ["VIEW_CREDITS", "MANAGE_CREDITS"],
  },
  {
    key: "cautions",
    label: "Cautions",
    icon: ShieldAlert,
    permissions: ["VIEW_CAUTIONS", "MANAGE_CAUTIONS"],
  },
  {
    key: "roles",
    label: "Rôles",
    icon: Shield,
    permissions: ["VIEW_ROLES", "MANAGE_ROLES"],
  },
  {
    key: "invitations",
    label: "Invitations",
    icon: Mail,
    permissions: ["VIEW_INVITATIONS", "MANAGE_INVITATIONS"],
  },
  {
    key: "audit",
    label: "Audit",
    icon: FileText,
    permissions: ["VIEW_AUDIT_LOGS", "EXPORT_AUDIT_LOGS"],
  },
  {
    key: "files",
    label: "Fichiers",
    icon: FileText,
    permissions: ["VIEW_FILES", "MANAGE_FILES"],
  },
  {
    key: "sections",
    label: "Sections",
    icon: FolderTree,
    permissions: ["VIEW_SECTIONS", "MANAGE_SECTIONS"],
  },
  {
    key: "products",
    label: "Produits",
    icon: Package,
    permissions: ["VIEW_PRODUCTS", "MANAGE_PRODUCTS"],
  },
  {
    key: "reservations",
    label: "Réservations",
    icon: Calendar,
    permissions: ["VIEW_RESERVATIONS", "MANAGE_RESERVATIONS"],
  },
  {
    key: "statistics",
    label: "Statistiques",
    icon: BarChart3,
    permissions: ["VIEW_STATISTICS"],
  },
  {
    key: "settings",
    label: "Paramètres",
    icon: Settings,
    permissions: ["VIEW_SETTINGS", "MANAGE_SETTINGS"],
  },
  {
    key: "maintenance",
    label: "Maintenance",
    icon: Wrench,
    permissions: ["BYPASS_MAINTENANCE", "BACKUP_DATABASE"],
  },
];

// Permission hierarchy: when selecting a MANAGE permission, auto-select VIEW dependencies
export const PERMISSION_HIERARCHY: Record<string, string[]> = {
  // MANAGE_* requires VIEW_* and VIEW_ADMIN_PANEL
  MANAGE_USERS: ["VIEW_USERS", "VIEW_ADMIN_PANEL"],
  MANAGE_CREDITS: ["VIEW_CREDITS", "VIEW_ADMIN_PANEL"],
  MANAGE_CAUTIONS: ["VIEW_CAUTIONS", "VIEW_ADMIN_PANEL"],
  MANAGE_ROLES: ["VIEW_ROLES", "VIEW_ADMIN_PANEL"],
  MANAGE_INVITATIONS: ["VIEW_INVITATIONS", "VIEW_ADMIN_PANEL"],
  MANAGE_FILES: ["VIEW_FILES", "VIEW_ADMIN_PANEL"],
  MANAGE_SECTIONS: ["VIEW_SECTIONS", "VIEW_ADMIN_PANEL"],
  MANAGE_PRODUCTS: ["VIEW_PRODUCTS", "VIEW_ADMIN_PANEL"],
  MANAGE_RESERVATIONS: ["VIEW_RESERVATIONS", "VIEW_ADMIN_PANEL"],
  MANAGE_SETTINGS: ["VIEW_SETTINGS", "VIEW_ADMIN_PANEL"],
  // EXPORT_AUDIT_LOGS requires VIEW_AUDIT_LOGS
  EXPORT_AUDIT_LOGS: ["VIEW_AUDIT_LOGS", "VIEW_ADMIN_PANEL"],
  // VIEW_* requires VIEW_ADMIN_PANEL
  VIEW_USERS: ["VIEW_ADMIN_PANEL"],
  VIEW_CREDITS: ["VIEW_ADMIN_PANEL"],
  VIEW_CAUTIONS: ["VIEW_ADMIN_PANEL"],
  VIEW_ROLES: ["VIEW_ADMIN_PANEL"],
  VIEW_INVITATIONS: ["VIEW_ADMIN_PANEL"],
  VIEW_AUDIT_LOGS: ["VIEW_ADMIN_PANEL"],
  VIEW_SECTIONS: ["VIEW_ADMIN_PANEL"],
  VIEW_PRODUCTS: ["VIEW_ADMIN_PANEL"],
  VIEW_RESERVATIONS: ["VIEW_ADMIN_PANEL"],
  VIEW_STATISTICS: ["VIEW_ADMIN_PANEL"],
  VIEW_SETTINGS: ["VIEW_ADMIN_PANEL"],
  // VIEW_FILES doesn't require admin panel (user can view their own files)
  // BYPASS_MAINTENANCE is independent
};

// Reverse hierarchy: what permissions depend on this one
export const PERMISSION_DEPENDENTS: Record<string, string[]> = {
  VIEW_ADMIN_PANEL: [
    "VIEW_USERS",
    "MANAGE_USERS",
    "VIEW_CREDITS",
    "MANAGE_CREDITS",
    "VIEW_CAUTIONS",
    "MANAGE_CAUTIONS",
    "VIEW_ROLES",
    "MANAGE_ROLES",
    "VIEW_INVITATIONS",
    "MANAGE_INVITATIONS",
    "VIEW_AUDIT_LOGS",
    "EXPORT_AUDIT_LOGS",
    "VIEW_SECTIONS",
    "MANAGE_SECTIONS",
    "VIEW_PRODUCTS",
    "MANAGE_PRODUCTS",
    "VIEW_RESERVATIONS",
    "MANAGE_RESERVATIONS",
    "VIEW_STATISTICS",
    "VIEW_SETTINGS",
    "MANAGE_SETTINGS",
  ],
  VIEW_USERS: ["MANAGE_USERS"],
  VIEW_CREDITS: ["MANAGE_CREDITS"],
  VIEW_CAUTIONS: ["MANAGE_CAUTIONS"],
  VIEW_ROLES: ["MANAGE_ROLES"],
  VIEW_INVITATIONS: ["MANAGE_INVITATIONS"],
  VIEW_AUDIT_LOGS: ["EXPORT_AUDIT_LOGS"],
  VIEW_FILES: ["MANAGE_FILES"],
  VIEW_SECTIONS: ["MANAGE_SECTIONS"],
  VIEW_PRODUCTS: ["MANAGE_PRODUCTS"],
  VIEW_RESERVATIONS: ["MANAGE_RESERVATIONS"],
  VIEW_SETTINGS: ["MANAGE_SETTINGS"],
};

/**
 * Apply permission hierarchy when selecting/deselecting a permission
 * @param selected Current selected permissions
 * @param permission The permission being toggled
 * @param checked Whether it's being checked or unchecked
 * @returns New set of permissions
 */
export function applyPermissionHierarchy(
  selected: string[],
  permission: string,
  checked: boolean,
): string[] {
  const selectedSet = new Set(selected);

  if (checked) {
    // Add the permission and all its dependencies
    selectedSet.add(permission);
    const dependencies = PERMISSION_HIERARCHY[permission] || [];
    dependencies.forEach((dep) => selectedSet.add(dep));
  } else {
    // Remove the permission and all permissions that depend on it
    selectedSet.delete(permission);
    const dependents = PERMISSION_DEPENDENTS[permission] || [];
    dependents.forEach((dep) => selectedSet.delete(dep));
  }

  return Array.from(selectedSet);
}

/**
 * Check if a permission is implicitly required by selected permissions
 * @param permission The permission to check
 * @param selected Currently selected permissions
 * @returns true if the permission is required by another selected permission
 */
export function isPermissionRequired(
  permission: string,
  selected: string[],
): boolean {
  // Check if any selected permission requires this one
  return selected.some((p) => {
    const deps = PERMISSION_HIERARCHY[p] || [];
    return deps.includes(permission);
  });
}

/**
 * Get permission display name (human-readable)
 */
export function getPermissionDisplayName(permission: string): string {
  const displayNames: Record<string, string> = {
    VIEW_ADMIN_PANEL: "Accès au panneau d'administration",
    VIEW_USERS: "Voir les utilisateurs",
    MANAGE_USERS: "Gérer les utilisateurs",
    VIEW_CREDITS: "Voir les crédits",
    MANAGE_CREDITS: "Gérer les crédits",
    VIEW_CAUTIONS: "Voir les cautions",
    MANAGE_CAUTIONS: "Gérer les cautions",
    VIEW_ROLES: "Voir les rôles",
    MANAGE_ROLES: "Gérer les rôles",
    VIEW_INVITATIONS: "Voir les invitations",
    MANAGE_INVITATIONS: "Gérer les invitations",
    VIEW_AUDIT_LOGS: "Voir les logs d'audit",
    EXPORT_AUDIT_LOGS: "Exporter les logs d'audit",
    VIEW_FILES: "Voir les fichiers",
    MANAGE_FILES: "Gérer les fichiers",
    VIEW_SECTIONS: "Voir les sections",
    MANAGE_SECTIONS: "Gérer les sections",
    VIEW_PRODUCTS: "Voir les produits",
    MANAGE_PRODUCTS: "Gérer les produits",
    VIEW_RESERVATIONS: "Voir les réservations",
    MANAGE_RESERVATIONS: "Gérer les réservations",
    VIEW_STATISTICS: "Voir les statistiques",
    VIEW_SETTINGS: "Voir les paramètres",
    MANAGE_SETTINGS: "Gérer les paramètres",
    BYPASS_MAINTENANCE: "Accès en maintenance",
    BACKUP_DATABASE: "Sauvegarde BDD",
  };
  return displayNames[permission] || permission;
}

/**
 * Get permission description (detailed explanation)
 */
export function getPermissionDescription(permission: string): string {
  const descriptions: Record<string, string> = {
    VIEW_ADMIN_PANEL:
      "Permet d'accéder au menu d'administration. Requis pour toutes les autres permissions d'administration.",
    VIEW_USERS:
      "Permet de voir la liste des utilisateurs et leurs profils dans le panneau d'administration.",
    MANAGE_USERS:
      "Permet de modifier les informations des utilisateurs, changer leurs rôles et désactiver leurs comptes.",
    VIEW_CREDITS: "Permet de voir le solde de crédits des utilisateurs.",
    MANAGE_CREDITS: "Permet d'ajouter ou retirer des crédits aux utilisateurs.",
    VIEW_CAUTIONS: "Permet de voir les cautions versées par les utilisateurs.",
    MANAGE_CAUTIONS:
      "Permet de gérer les cautions : ajouter, modifier ou rembourser.",
    VIEW_ROLES:
      "Permet de voir la liste des rôles et leurs permissions associées.",
    MANAGE_ROLES:
      "Permet de créer, modifier et supprimer des rôles, ainsi que leurs permissions.",
    VIEW_INVITATIONS:
      "Permet de voir les invitations envoyées aux nouveaux utilisateurs.",
    MANAGE_INVITATIONS: "Permet d'envoyer des invitations et de les révoquer.",
    VIEW_AUDIT_LOGS:
      "Permet de consulter l'historique des actions effectuées dans l'application.",
    EXPORT_AUDIT_LOGS:
      "Permet d'exporter les logs d'audit au format CSV ou Excel.",
    VIEW_FILES: "Permet de voir les fichiers uploadés dans l'application.",
    MANAGE_FILES: "Permet d'uploader, modifier et supprimer des fichiers.",
    VIEW_SECTIONS:
      "Permet de voir les sections et leurs paramètres (horaires, fermetures, etc.).",
    MANAGE_SECTIONS:
      "Permet de créer, modifier et supprimer des sections et leurs sous-sections.",
    VIEW_PRODUCTS:
      "Permet de voir les produits dans le panneau d'administration.",
    MANAGE_PRODUCTS:
      "Permet de créer, modifier et supprimer des produits, gérer leur disponibilité.",
    VIEW_RESERVATIONS:
      "Permet de voir toutes les réservations dans le panneau d'administration.",
    MANAGE_RESERVATIONS:
      "Permet de valider, annuler et modifier les réservations des utilisateurs.",
    VIEW_STATISTICS:
      "Permet d'accéder au tableau de bord et aux statistiques d'utilisation.",
    VIEW_SETTINGS: "Permet de voir les paramètres de l'application.",
    MANAGE_SETTINGS:
      "Permet de modifier les paramètres globaux de l'application.",
    BYPASS_MAINTENANCE:
      "Permet d'accéder à l'application même lorsque le mode maintenance est activé.",
    BACKUP_DATABASE:
      "Permet de télécharger une sauvegarde complète de la base de données au format SQL.",
  };
  return descriptions[permission] || "";
}

/**
 * Get role badge color based on role name or system status
 */
export function getRoleBadgeVariant(role: {
  name: string;
  isSystem: boolean;
}): "default" | "secondary" | "destructive" | "outline" {
  if (role.name === "Super Admin") return "destructive";
  if (role.isSystem) return "secondary";
  return "default";
}

/**
 * Get all permissions as a flat array from categories
 */
export function getAllPermissions(): string[] {
  return PERMISSION_CATEGORIES.flatMap((cat) => cat.permissions);
}
