import { useState } from "react";
import { Shield, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";
import { useAssignRole, useRevokeRole } from "../hooks/useUsers";
import { rolesApi } from "@/api/roles.api";
import type { UserRoleAssignment } from "@/api/users.api";

interface UserRolesCardProps {
  userId: string;
  roles: UserRoleAssignment[];
  canManageRoles: boolean;
}

export function UserRolesCard({
  userId,
  roles,
  canManageRoles,
}: UserRolesCardProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [roleToRevoke, setRoleToRevoke] = useState<UserRoleAssignment | null>(
    null,
  );

  // Use rolesApi from roles.api.ts which returns Role[] directly
  const { data: allRoles = [] } = useQuery({
    queryKey: ["roles", "all"],
    queryFn: () => rolesApi.getRoles(),
    staleTime: 5 * 60 * 1000,
  });
  const assignRole = useAssignRole();
  const revokeRole = useRevokeRole();

  // Get available roles (not already assigned to user)
  const assignedRoleIds = roles.map((r) => r.roleId);
  const availableRoles = allRoles.filter(
    (r) => !assignedRoleIds.includes(r.id),
  );

  const handleAssignRole = () => {
    if (!selectedRoleId) return;

    assignRole.mutate(
      { userId, roleId: selectedRoleId },
      {
        onSuccess: () => {
          setSelectedRoleId("");
        },
      },
    );
  };

  const handleRevokeClick = (roleAssignment: UserRoleAssignment) => {
    // Don't allow revoking the "Utilisateur" role
    if (roleAssignment.role.name === "Utilisateur") {
      return;
    }
    setRoleToRevoke(roleAssignment);
    setRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = () => {
    if (!roleToRevoke) return;

    revokeRole.mutate(
      { userId, roleId: roleToRevoke.roleId },
      {
        onSuccess: () => {
          setRevokeDialogOpen(false);
          setRoleToRevoke(null);
        },
      },
    );
  };

  const isDefaultRole = (roleName: string) => roleName === "Utilisateur";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rôles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current roles */}
          <div className="flex flex-wrap gap-2">
            {roles.map((roleAssignment) => (
              <Badge
                key={roleAssignment.roleId}
                variant={
                  isDefaultRole(roleAssignment.role.name)
                    ? "default"
                    : "secondary"
                }
                className="flex items-center gap-1 py-1 px-2"
              >
                {roleAssignment.role.name}
                {roleAssignment.section && (
                  <span className="text-xs opacity-70">
                    ({roleAssignment.section.name})
                  </span>
                )}
                {canManageRoles && !isDefaultRole(roleAssignment.role.name) && (
                  <button
                    onClick={() => handleRevokeClick(roleAssignment)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                    disabled={revokeRole.isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>

          {/* Add role */}
          {canManageRoles && availableRoles.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t">
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger className="w-full sm:flex-1">
                  <SelectValue placeholder="Ajouter un rôle..." />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <span className="truncate">{role.name}</span>
                      {role.description && (
                        <span className="text-muted-foreground ml-2 text-xs truncate max-w-[150px] hidden sm:inline">
                          - {role.description}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAssignRole}
                disabled={!selectedRoleId || assignRole.isPending}
                className="w-full sm:w-auto shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
          )}

          {canManageRoles && availableRoles.length === 0 && (
            <p className="text-sm text-muted-foreground pt-2 border-t">
              Tous les rôles sont déjà assignés à cet utilisateur.
            </p>
          )}

          {!canManageRoles && (
            <p className="text-sm text-muted-foreground">
              Vous n'avez pas la permission de modifier les rôles.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Revoke confirmation dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer le rôle</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir révoquer le rôle "
              {roleToRevoke?.role.name}" de cet utilisateur ? Cette action peut
              affecter les permissions de l'utilisateur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Révoquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
