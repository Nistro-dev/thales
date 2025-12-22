import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePermissions } from "../hooks/useRoles";
import {
  applyPermissionHierarchy,
  isPermissionRequired,
  getPermissionDisplayName,
  getPermissionDescription,
} from "../utils/roleHelpers";
import { cn } from "@/lib/utils";
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
  Info,
  type LucideIcon,
} from "lucide-react";

interface PermissionMatrixProps {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}

// Map category keys to icons
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  admin: LayoutDashboard,
  users: Users,
  credits: CreditCard,
  cautions: ShieldAlert,
  roles: Shield,
  invitations: Mail,
  audit: FileText,
  files: FileText,
  sections: FolderTree,
  products: Package,
  reservations: Calendar,
  statistics: BarChart3,
  settings: Settings,
  maintenance: Wrench,
};

// Map category keys to French labels
const CATEGORY_LABELS: Record<string, string> = {
  admin: "Panneau d'administration",
  users: "Utilisateurs",
  credits: "Crédits",
  cautions: "Cautions",
  roles: "Rôles",
  invitations: "Invitations",
  audit: "Audit",
  files: "Fichiers",
  sections: "Sections",
  products: "Produits",
  reservations: "Réservations",
  statistics: "Statistiques",
  settings: "Paramètres",
  maintenance: "Maintenance",
};

export function PermissionMatrix({
  selectedPermissions,
  onChange,
  disabled = false,
}: PermissionMatrixProps) {
  const { data: permissions, isLoading } = usePermissions();

  const handlePermissionChange = (permission: string, checked: boolean) => {
    const newPermissions = applyPermissionHierarchy(
      selectedPermissions,
      permission,
      checked,
    );
    onChange(newPermissions);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  // Group permissions by category
  const groupedPermissions =
    permissions?.reduce(
      (acc, permission) => {
        const category = permission.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(permission);
        return acc;
      },
      {} as Record<string, typeof permissions>,
    ) ?? {};

  // Sort categories in a logical order
  const categoryOrder = [
    "admin",
    "users",
    "credits",
    "cautions",
    "roles",
    "invitations",
    "audit",
    "files",
    "sections",
    "products",
    "reservations",
    "statistics",
    "settings",
    "maintenance",
  ];

  const sortedCategories = Object.keys(groupedPermissions).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-3">
        {sortedCategories.map((category) => {
          const categoryPermissions = groupedPermissions[category] || [];
          const Icon = CATEGORY_ICONS[category] || Shield;
          const label = CATEGORY_LABELS[category] || category;
          const selectedInCategory = categoryPermissions.filter((p) =>
            selectedPermissions.includes(p.key),
          );

          return (
            <Card key={category} className="overflow-hidden">
              <CardHeader className="py-2 px-4 bg-muted/50">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                  {selectedInCategory.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({selectedInCategory.length}/{categoryPermissions.length})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="space-y-1">
                  {categoryPermissions.map((permission) => {
                    const isChecked = selectedPermissions.includes(
                      permission.key,
                    );
                    const isRequired = isPermissionRequired(
                      permission.key,
                      selectedPermissions,
                    );
                    const isManagePermission =
                      permission.key.startsWith("MANAGE_") ||
                      permission.key === "EXPORT_AUDIT_LOGS";
                    const description = getPermissionDescription(
                      permission.key,
                    );

                    return (
                      <div
                        key={permission.id}
                        className={cn(
                          "flex items-center space-x-3 py-1",
                          isManagePermission && "ml-4",
                        )}
                      >
                        <Checkbox
                          id={permission.key}
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(
                              permission.key,
                              checked === true,
                            )
                          }
                          disabled={disabled || isRequired}
                        />
                        <Label
                          htmlFor={permission.key}
                          className={cn(
                            "text-sm cursor-pointer flex items-center gap-1.5",
                            disabled && "cursor-not-allowed opacity-50",
                            isRequired && "text-muted-foreground",
                          )}
                        >
                          {getPermissionDisplayName(permission.key)}
                          {isRequired && (
                            <span className="text-xs text-muted-foreground">
                              (requis)
                            </span>
                          )}
                          {description && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <p>{description}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
