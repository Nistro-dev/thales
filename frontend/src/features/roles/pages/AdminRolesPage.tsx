import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Plus, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { RoleTable } from "../components/RoleTable";
import { RoleForm } from "../components/RoleForm";
import { RoleDetail } from "../components/RoleDetail";
import {
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from "../hooks/useRoles";
import type { Role } from "@/api/roles.api";
import { ROUTES } from "@/constants/routes";

type ViewMode = "list" | "detail" | "edit";

export function AdminRolesPage() {
  const navigate = useNavigate();
  const { id: roleId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const isCreateMode = searchParams.get("create") === "true";
  const isEditMode = searchParams.get("edit") === "true";

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // Queries
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: roleDetail, isLoading: roleDetailLoading } = useRole(roleId);

  // Mutations
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  // Determine current view mode
  // Note: isCreateMode is handled as a dialog overlay on list view
  const getViewMode = (): ViewMode => {
    if (roleId && isEditMode) return "edit";
    if (roleId) return "detail";
    return "list";
  };

  const viewMode = getViewMode();

  // Navigation handlers
  const handleViewRole = (role: Role) => {
    navigate(ROUTES.ADMIN_ROLE_DETAIL.replace(":id", role.id));
  };

  const handleEditRole = (role: Role) => {
    navigate(`${ROUTES.ADMIN_ROLE_DETAIL.replace(":id", role.id)}?edit=true`);
  };

  const handleCreateClick = () => {
    setSearchParams({ create: "true" });
  };

  const handleBackToList = () => {
    navigate(ROUTES.ADMIN_ROLES);
  };

  const handleCancelEdit = () => {
    if (roleId) {
      navigate(ROUTES.ADMIN_ROLE_DETAIL.replace(":id", roleId));
    } else {
      handleBackToList();
    }
  };

  // Form handlers
  const handleCreateSubmit = async (data: {
    name: string;
    description?: string;
    permissions: string[];
    sectionIds?: string[];
  }) => {
    await createRole.mutateAsync({
      name: data.name,
      description: data.description,
      permissionKeys: data.permissions,
      sectionIds: data.sectionIds,
    });
    handleBackToList();
  };

  const handleUpdateSubmit = async (data: {
    name: string;
    description?: string;
    permissions: string[];
    sectionIds?: string[];
  }) => {
    if (!roleId) return;
    await updateRole.mutateAsync({
      id: roleId,
      data: {
        name: data.name,
        description: data.description,
        permissionKeys: data.permissions,
        sectionIds: data.sectionIds,
      },
    });
    navigate(ROUTES.ADMIN_ROLE_DETAIL.replace(":id", roleId));
  };

  // Delete handlers
  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;
    await deleteRole.mutateAsync(roleToDelete.id);
    setDeleteDialogOpen(false);
    setRoleToDelete(null);
    handleBackToList();
  };

  // Render list view
  if (viewMode === "list") {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Rôles & Permissions
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Gérez les rôles et leurs permissions
            </p>
          </div>
          <Button onClick={handleCreateClick} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau rôle
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <RoleTable
              roles={roles || []}
              isLoading={rolesLoading}
              onView={handleViewRole}
              onEdit={handleEditRole}
              onDelete={handleDeleteClick}
            />
          </CardContent>
        </Card>

        {/* Create Role Dialog */}
        <Dialog open={isCreateMode} onOpenChange={() => handleBackToList()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un rôle</DialogTitle>
              <DialogDescription>
                Définissez un nouveau rôle avec ses permissions associées
              </DialogDescription>
            </DialogHeader>
            <RoleForm
              onSubmit={handleCreateSubmit}
              onCancel={handleBackToList}
              isSubmitting={createRole.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le rôle</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le rôle "{roleToDelete?.name}
                " ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteRole.isPending ? "Suppression..." : "Supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Render detail view
  if (viewMode === "detail") {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBackToList}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux rôles
          </Button>
        </div>

        <RoleDetail
          role={roleDetail}
          isLoading={roleDetailLoading}
          onEdit={() => handleEditRole(roleDetail!)}
          onDelete={() => handleDeleteClick(roleDetail!)}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le rôle</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le rôle "{roleToDelete?.name}
                " ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteRole.isPending ? "Suppression..." : "Supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Render edit view
  if (viewMode === "edit") {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleCancelEdit}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au détail
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Modifier le rôle</CardTitle>
          </CardHeader>
          <CardContent>
            {roleDetailLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Chargement...
              </div>
            ) : roleDetail ? (
              <RoleForm
                role={roleDetail}
                onSubmit={handleUpdateSubmit}
                onCancel={handleCancelEdit}
                isSubmitting={updateRole.isPending}
              />
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Rôle introuvable
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
