import { useState } from "react";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Shield,
  Crown,
  User,
  Globe,
  FolderTree,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { Role } from "@/api/roles.api";

interface RoleTableProps {
  roles: Role[];
  isLoading?: boolean;
  onView?: (role: Role) => void;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
}

function getRoleIcon(role: Role) {
  if (role.name === "Super Admin") return Crown;
  if (role.isSystem) return Shield;
  return User;
}

export function RoleTable({
  roles,
  isLoading,
  onView,
  onEdit,
  onDelete,
}: RoleTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleDeleteClick = (role: Role) => {
    setSelectedRole(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedRole && onDelete) {
      onDelete(selectedRole);
    }
    setDeleteDialogOpen(false);
    setSelectedRole(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!roles.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun rôle trouvé
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rôle</TableHead>
            <TableHead className="text-center">Utilisateurs</TableHead>
            <TableHead className="text-center">Permissions</TableHead>
            <TableHead className="text-center hidden sm:table-cell">
              Sections
            </TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => {
            const RoleIcon = getRoleIcon(role);
            const canEdit = !role.isSystem;
            const canDelete = !role.isSystem && (role.userCount ?? 0) === 0;

            return (
              <TableRow
                key={role.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onView?.(role)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                      <RoleIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {role.name}
                        {role.isSystem && (
                          <Badge variant="outline" className="text-xs">
                            Système
                          </Badge>
                        )}
                      </div>
                      {role.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {role.description}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{role.userCount ?? 0}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">
                    {role.permissions.length === 23
                      ? "Toutes"
                      : role.permissions.length}
                  </Badge>
                </TableCell>
                <TableCell className="text-center hidden sm:table-cell">
                  {!role.sections || role.sections.length === 0 ? (
                    <Badge variant="outline" className="gap-1">
                      <Globe className="h-3 w-3" />
                      Global
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <FolderTree className="h-3 w-3" />
                      {role.sections.length}
                    </Badge>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView?.(role)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir
                      </DropdownMenuItem>
                      {canEdit && (
                        <DropdownMenuItem onClick={() => onEdit?.(role)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(role)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le rôle</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le rôle "{selectedRole?.name}"
              ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
