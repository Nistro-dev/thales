import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { PermissionMatrix } from "./PermissionMatrix";
import { useSections } from "@/features/products/hooks/useSections";
import type { Role } from "@/api/roles.api";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const roleSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  permissions: z
    .array(z.string())
    .min(1, "Sélectionnez au moins une permission"),
  sectionIds: z.array(z.string()).optional(),
});

export type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
  role?: Role;
  onSubmit: (data: RoleFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function RoleForm({
  role,
  onSubmit,
  onCancel,
  isSubmitting,
}: RoleFormProps) {
  const { data: sections = [] } = useSections();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissions: role?.permissions || [],
      sectionIds: role?.sections?.map((s) => s.sectionId) || [],
    },
  });

  const selectedPermissions = watch("permissions");
  const selectedSectionIds = watch("sectionIds") || [];

  const handlePermissionsChange = (permissions: string[]) => {
    setValue("permissions", permissions, { shouldValidate: true });
  };

  const handleSectionsChange = (sectionIds: string[]) => {
    setValue("sectionIds", sectionIds);
  };

  const sectionOptions = sections.map((section) => ({
    value: section.id,
    label: section.name,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du rôle *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Ex: Manager Section Photo"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Description du rôle (optionnel)"
            rows={2}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Restriction par section</Label>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>
                    Si des sections sont sélectionnées, les utilisateurs avec ce
                    rôle n'auront accès qu'aux données de ces sections
                    spécifiques (produits, réservations, etc.). Laissez vide
                    pour un accès global.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <MultiSelect
            options={sectionOptions}
            selected={selectedSectionIds}
            onChange={handleSectionsChange}
            placeholder="Toutes les sections (accès global)"
            emptyMessage="Aucune section disponible"
            disabled={isSubmitting}
          />
          {selectedSectionIds.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedSectionIds.length} section(s) sélectionnée(s) - accès
              limité
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Permissions *</Label>
          <span className="text-sm text-muted-foreground">
            {selectedPermissions.length} sélectionnée(s)
          </span>
        </div>
        {errors.permissions && (
          <p className="text-sm text-destructive">
            {errors.permissions.message}
          </p>
        )}
        <PermissionMatrix
          selectedPermissions={selectedPermissions}
          onChange={handlePermissionsChange}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Enregistrement..."
            : role
              ? "Mettre à jour"
              : "Créer le rôle"}
        </Button>
      </div>
    </form>
  );
}
