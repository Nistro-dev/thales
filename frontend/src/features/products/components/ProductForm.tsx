import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSections } from "@/features/products/hooks/useSections";
import type { Product } from "@/types";

// Schema
const productSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(200),
  reference: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  priceCredits: z.coerce.number().min(0, "Le prix doit être positif"),
  creditPeriod: z.enum(["DAY", "WEEK"]).default("DAY"),
  minDuration: z.coerce.number().min(1, "Minimum 1 jour").default(1),
  maxDuration: z.coerce
    .number()
    .min(0, "Minimum 0 (illimité) ou 1+ jours")
    .default(0),
  sectionId: z.string().min(1, "La section est requise"),
  subSectionId: z.string().optional(),
  attributes: z
    .array(
      z.object({
        key: z.string().min(1, "La clé est requise"),
        value: z.string().min(1, "La valeur est requise"),
      }),
    )
    .optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProductForm({
  product,
  onSubmit,
  onCancel,
  isSubmitting,
}: ProductFormProps) {
  const { data: sections } = useSections();

  // Checkboxes for "no min/max duration"
  // minDuration = 1 means "no minimum" (default)
  // maxDuration = 0 means "no maximum" (unlimited)
  const [noMinDuration, setNoMinDuration] = useState(() => {
    if (product) {
      return product.minDuration === 1;
    }
    return true;
  });
  const [noMaxDuration, setNoMaxDuration] = useState(() => {
    if (product) {
      return product.maxDuration === 0;
    }
    return true;
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          reference: product.reference || "",
          description: product.description || "",
          priceCredits: product.priceCredits ?? 0,
          creditPeriod: product.creditPeriod || "DAY",
          minDuration: product.minDuration,
          maxDuration: product.maxDuration,
          sectionId: product.sectionId,
          subSectionId: product.subSectionId || "",
          attributes:
            product.attributes?.map((attr) => ({
              key: attr.key,
              value: attr.value,
            })) || [],
        }
      : {
          name: "",
          reference: "",
          description: "",
          priceCredits: 0,
          creditPeriod: "DAY",
          minDuration: 1,
          maxDuration: 0, // 0 = unlimited
          sectionId: "",
          subSectionId: "",
          attributes: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "attributes",
  });

  const selectedSectionId = watch("sectionId");
  const selectedSection = sections?.find((s) => s.id === selectedSectionId);
  const subSections = selectedSection?.subSections || [];

  // Reset form only when product reference changes (not on every re-render)
  useEffect(() => {
    if (product) {
      setNoMinDuration(product.minDuration === 1);
      setNoMaxDuration(product.maxDuration === 0);
      reset({
        name: product.name,
        reference: product.reference || "",
        description: product.description || "",
        priceCredits: product.priceCredits ?? 0,
        creditPeriod: product.creditPeriod || "DAY",
        minDuration: product.minDuration,
        maxDuration: product.maxDuration,
        sectionId: product.sectionId,
        subSectionId: product.subSectionId || "",
        attributes:
          product.attributes?.map((attr) => ({
            key: attr.key,
            value: attr.value,
          })) || [],
      });
    }
  }, [product?.id, reset]);

  // Reset subsection when section changes
  useEffect(() => {
    if (selectedSectionId !== product?.sectionId) {
      setValue("subSectionId", "");
    }
  }, [selectedSectionId, product?.sectionId, setValue]);

  const handleFormSubmit = handleSubmit(async (data) => {
    // Clean up empty subSectionId and apply default durations
    // maxDuration = 0 means unlimited
    const cleanedData = {
      ...data,
      subSectionId: data.subSectionId || undefined,
      reference: data.reference || undefined,
      description: data.description || undefined,
      minDuration: noMinDuration ? 1 : data.minDuration,
      maxDuration: noMaxDuration ? 0 : data.maxDuration,
      attributes: data.attributes?.filter((attr) => attr.key && attr.value),
    };
    await onSubmit(cleanedData);
  });

  // Use key to force re-render when product changes
  const formKey = product?.id || "new";

  return (
    <form
      key={formKey}
      onSubmit={handleFormSubmit}
      className="space-y-6 overflow-hidden"
    >
      {/* Basic Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nom *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Nom du produit"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reference">Référence</Label>
          <Input
            id="reference"
            {...register("reference")}
            placeholder="Ex: CAN-5D-MK4"
            disabled={isSubmitting}
          />
          {errors.reference && (
            <p className="text-sm text-destructive">
              {errors.reference.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Description du produit"
          disabled={isSubmitting}
          rows={4}
        />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Section & SubSection */}
      <div className="grid gap-4 md:grid-cols-2 overflow-hidden">
        <div className="space-y-2 relative">
          <Label>Section *</Label>
          <Select
            value={selectedSectionId || ""}
            onValueChange={(value) => setValue("sectionId", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une section" />
            </SelectTrigger>
            <SelectContent>
              {sections?.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sectionId && (
            <p className="text-sm text-destructive">
              {errors.sectionId.message}
            </p>
          )}
        </div>

        <div className="space-y-2 relative">
          <Label>Sous-section</Label>
          <Select
            value={watch("subSectionId") || "none"}
            onValueChange={(value) =>
              setValue("subSectionId", value === "none" ? "" : value)
            }
            disabled={isSubmitting || subSections.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une sous-section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune</SelectItem>
              {subSections.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pricing */}
      <div className="grid gap-4 grid-cols-2 overflow-hidden">
        <div className="space-y-2">
          <Label htmlFor="priceCredits">Prix (crédits) *</Label>
          <Input
            id="priceCredits"
            type="number"
            min="0"
            {...register("priceCredits")}
            disabled={isSubmitting}
          />
          {errors.priceCredits && (
            <p className="text-sm text-destructive">
              {errors.priceCredits.message}
            </p>
          )}
        </div>

        <div className="space-y-2 relative">
          <Label>Facturation</Label>
          <Select
            value={watch("creditPeriod") || "DAY"}
            onValueChange={(value: "DAY" | "WEEK") =>
              setValue("creditPeriod", value)
            }
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Période de facturation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAY">Par jour</SelectItem>
              <SelectItem value="WEEK">Par semaine</SelectItem>
            </SelectContent>
          </Select>
          {errors.creditPeriod && (
            <p className="text-sm text-destructive">
              {errors.creditPeriod.message}
            </p>
          )}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-4">
        <Label>Durée de réservation</Label>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {/* Min Duration */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="noMinDuration"
                checked={noMinDuration}
                onCheckedChange={(checked) => {
                  setNoMinDuration(!!checked);
                  if (checked) {
                    setValue("minDuration", 1);
                  }
                }}
                disabled={isSubmitting}
              />
              <Label
                htmlFor="noMinDuration"
                className="text-sm font-normal cursor-pointer"
              >
                Sans durée minimum
              </Label>
            </div>
            {!noMinDuration && (
              <div className="space-y-1">
                <Input
                  id="minDuration"
                  type="number"
                  min="1"
                  {...register("minDuration")}
                  disabled={isSubmitting}
                  placeholder="Durée min (jours)"
                />
                {errors.minDuration && (
                  <p className="text-sm text-destructive">
                    {errors.minDuration.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Max Duration */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="noMaxDuration"
                checked={noMaxDuration}
                onCheckedChange={(checked) => {
                  setNoMaxDuration(!!checked);
                  if (checked) {
                    setValue("maxDuration", 0);
                  }
                }}
                disabled={isSubmitting}
              />
              <Label
                htmlFor="noMaxDuration"
                className="text-sm font-normal cursor-pointer"
              >
                Sans durée maximum (illimité)
              </Label>
            </div>
            {!noMaxDuration && (
              <div className="space-y-1">
                <Input
                  id="maxDuration"
                  type="number"
                  min="1"
                  {...register("maxDuration")}
                  disabled={isSubmitting}
                  placeholder="Durée max (jours)"
                />
                {errors.maxDuration && (
                  <p className="text-sm text-destructive">
                    {errors.maxDuration.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attributes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Attributs personnalisés</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ key: "", value: "" })}
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>

        {fields.length > 0 && (
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row gap-2">
                <Input
                  {...register(`attributes.${index}.key`)}
                  placeholder="Clé (ex: Capteur)"
                  disabled={isSubmitting}
                  className="flex-1 min-w-0"
                />
                <Input
                  {...register(`attributes.${index}.value`)}
                  placeholder="Valeur (ex: Full Frame)"
                  disabled={isSubmitting}
                  className="flex-1 min-w-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={isSubmitting}
                  className="text-destructive hover:text-destructive shrink-0 self-end sm:self-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucun attribut. Cliquez sur "Ajouter" pour créer des
            caractéristiques personnalisées.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {product ? "Enregistrer" : "Créer"}
        </Button>
      </div>
    </form>
  );
}
