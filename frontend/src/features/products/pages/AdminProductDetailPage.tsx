import { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  Link,
} from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Tag,
  Clock,
  FileText,
  History,
  Wrench,
  Calendar,
  Info,
  FolderOpen,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { ProductForm, type ProductFormData } from "../components/ProductForm";
import { ProductFilesList } from "../components/ProductFilesList";
import { ImageUpload } from "../components/ImageUpload";
import { ProductMovementsList } from "../components/ProductMovementsList";
import { ProductGallery } from "../components/ProductGallery";
import { ProductStatusManager } from "../components/ProductStatusManager";
import { MaintenanceHistory } from "../components/MaintenanceHistory";
import {
  useProductAdmin,
  useProductFilesAdmin,
  useProductMovements,
  useUpdateProduct,
  useDeleteProduct,
} from "../hooks/useProductsAdmin";
import { ROUTES } from "@/constants/routes";

export function AdminProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isEditMode = searchParams.get("edit") === "true";

  const { data: product, isLoading, isError } = useProductAdmin(id);
  const { data: files, isLoading: filesLoading } = useProductFilesAdmin(id);
  const { data: movements, isLoading: movementsLoading } =
    useProductMovements(id);

  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Switch to details tab when exiting edit mode
  useEffect(() => {
    if (!isEditMode && activeTab === "edit") {
      setActiveTab("details");
    }
  }, [isEditMode, activeTab]);

  const handleEditClick = () => {
    setSearchParams({ edit: "true" });
    setActiveTab("edit");
  };

  const handleCancelEdit = () => {
    setSearchParams({});
  };

  const handleSubmit = async (data: ProductFormData) => {
    if (!id) return;
    try {
      await updateProduct.mutateAsync({ id, data });
      setSearchParams({});
    } catch {
      // Error handled in hook
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteProduct.mutateAsync(id);
      navigate(ROUTES.ADMIN_PRODUCTS);
    } catch {
      // Error handled in hook
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-10 w-32 mb-6" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Skeleton className="aspect-square w-full rounded-lg" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
          <p className="text-destructive">Produit introuvable</p>
          <Button asChild variant="link" className="mt-4">
            <Link to={ROUTES.ADMIN_PRODUCTS}>Retour aux produits</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Button asChild variant="ghost" className="self-start">
          <Link to={ROUTES.ADMIN_PRODUCTS}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux produits
          </Link>
        </Button>

        {!isEditMode && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleEditClick}
              className="flex-1 sm:flex-none"
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
            {product.status !== "ARCHIVED" && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="flex-1 sm:flex-none"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Archiver
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Gallery & Quick Info */}
        <div className="space-y-6">
          {/* Gallery */}
          <Card>
            <CardContent className="p-4">
              <ProductGallery files={files || []} productName={product.name} />
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Seules les images (JPG, PNG, WebP, GIF) s'affichent ici.
                <br />
                Les autres fichiers sont dans l'onglet "Fichiers".
              </p>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground block mb-2">
                  Statut
                </span>
                <ProductStatusManager
                  productId={id!}
                  productName={product.name}
                  currentStatus={product.status}
                  disabled={isEditMode}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prix</span>
                <span className="font-medium">
                  {product.priceCredits} crédits/
                  {product.creditPeriod === "WEEK" ? "semaine" : "jour"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Durée</span>
                <span className="text-sm">
                  {product.minDuration} -{" "}
                  {product.maxDuration === 0 ? "∞" : product.maxDuration} jours
                </span>
              </div>

              {product.reference && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Référence
                  </span>
                  <span className="text-sm font-mono">{product.reference}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Section</span>
                <div className="text-sm text-right">
                  <div>{product.section.name}</div>
                  {product.subSection && (
                    <div className="text-muted-foreground">
                      {product.subSection.name}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {product.name}
              </CardTitle>
              {product.description && (
                <CardDescription>{product.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Tabs
                value={isEditMode ? "edit" : activeTab}
                onValueChange={setActiveTab}
              >
                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-4">
                  <TabsList className="w-full md:w-auto">
                    <TabsTrigger
                      value="details"
                      disabled={isEditMode}
                      className="flex-1 md:flex-none"
                    >
                      <Tag className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Détails</span>
                      <span className="sm:hidden">Détails</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="files"
                      disabled={isEditMode}
                      className="flex-1 md:flex-none"
                    >
                      <FileText className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">
                        Fichiers ({files?.length || 0})
                      </span>
                      <span className="sm:hidden">{files?.length || 0}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="movements"
                      disabled={isEditMode}
                      className="flex-1 md:flex-none"
                    >
                      <History className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Mouvements</span>
                      <span className="sm:hidden">Mvts</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="maintenance"
                      disabled={isEditMode}
                      className="flex-1 md:flex-none"
                    >
                      <Wrench className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Maintenance</span>
                      <span className="sm:hidden">Maint.</span>
                    </TabsTrigger>
                    {isEditMode && (
                      <TabsTrigger value="edit" className="flex-1 md:flex-none">
                        <Edit className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Modifier</span>
                        <span className="sm:hidden">Edit</span>
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-6">
                  {/* Attributes */}
                  {product.attributes && product.attributes.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Caractéristiques
                      </h3>
                      <div className="grid gap-2 bg-muted/30 rounded-lg p-4">
                        {product.attributes.map((attr) => (
                          <div
                            key={attr.id}
                            className="flex justify-between py-2 border-b border-border/50 last:border-0"
                          >
                            <span className="text-muted-foreground capitalize">
                              {attr.key}
                            </span>
                            <span className="font-medium">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section Info */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      Informations de la section
                    </h3>
                    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Section</span>
                        <span className="font-medium">
                          {product.section.name}
                        </span>
                      </div>
                      {product.subSection && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Sous-section
                          </span>
                          <span className="font-medium">
                            {product.subSection.name}
                          </span>
                        </div>
                      )}
                      {product.section.allowedDaysIn && (
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">
                            Jours de retrait
                          </span>
                          <div className="flex gap-1 flex-wrap justify-end">
                            {[
                              "Dim",
                              "Lun",
                              "Mar",
                              "Mer",
                              "Jeu",
                              "Ven",
                              "Sam",
                            ].map((day, i) => (
                              <Badge
                                key={day}
                                variant={
                                  product.section.allowedDaysIn?.includes(i)
                                    ? "default"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                {day}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {product.section.allowedDaysOut && (
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">
                            Jours de retour
                          </span>
                          <div className="flex gap-1 flex-wrap justify-end">
                            {[
                              "Dim",
                              "Lun",
                              "Mar",
                              "Mer",
                              "Jeu",
                              "Ven",
                              "Sam",
                            ].map((day, i) => (
                              <Badge
                                key={day}
                                variant={
                                  product.section.allowedDaysOut?.includes(i)
                                    ? "default"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                {day}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {product.section.refundDeadlineHours !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Délai d'annulation
                          </span>
                          <span className="font-medium">
                            {product.section.refundDeadlineHours}h avant
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Stats */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Informations système
                    </h3>
                    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          ID Produit
                        </span>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {product.id.substring(0, 8)}...
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Créé le</span>
                        <span className="text-sm">
                          {format(new Date(product.createdAt), "dd MMMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Modifié le
                        </span>
                        <span className="text-sm">
                          {format(
                            new Date(product.updatedAt),
                            "dd MMMM yyyy à HH:mm",
                            { locale: fr },
                          )}
                        </span>
                      </div>
                      {movements && movements.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Nombre de mouvements
                          </span>
                          <span className="font-medium">
                            {movements.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Last movement info - use actual movement data */}
                  {movements && movements.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Dernier mouvement
                      </h3>
                      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(
                              new Date(movements[0].performedAt),
                              "dd MMMM yyyy à HH:mm",
                              { locale: fr },
                            )}
                          </span>
                          <Badge
                            variant={
                              movements[0].type === "CHECKOUT"
                                ? "secondary"
                                : movements[0].type === "RETURN"
                                  ? "default"
                                  : "outline"
                            }
                          >
                            {movements[0].type === "CHECKOUT"
                              ? "Sortie"
                              : movements[0].type === "RETURN"
                                ? "Retour"
                                : "Changement de statut"}
                          </Badge>
                        </div>
                        {movements[0].type === "RETURN" &&
                          movements[0].condition && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">
                                État :
                              </span>
                              <Badge
                                variant={
                                  movements[0].condition === "OK"
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {movements[0].condition === "OK"
                                  ? "OK"
                                  : movements[0].condition === "MINOR_DAMAGE"
                                    ? "Dégâts mineurs"
                                    : movements[0].condition === "MAJOR_DAMAGE"
                                      ? "Dégâts majeurs"
                                      : movements[0].condition ===
                                          "MISSING_PARTS"
                                        ? "Pièces manquantes"
                                        : movements[0].condition === "BROKEN"
                                          ? "Cassé"
                                          : movements[0].condition}
                              </Badge>
                            </div>
                          )}
                        {movements[0].performedByUser && (
                          <div className="text-xs text-muted-foreground">
                            Par {movements[0].performedByUser.firstName}{" "}
                            {movements[0].performedByUser.lastName}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Files Tab */}
                <TabsContent value="files" className="space-y-6">
                  <ImageUpload productId={id!} />
                  <ProductFilesList
                    productId={id!}
                    files={files || []}
                    isLoading={filesLoading}
                  />
                </TabsContent>

                {/* Movements Tab */}
                <TabsContent value="movements">
                  <ProductMovementsList
                    movements={movements || []}
                    isLoading={movementsLoading}
                  />
                </TabsContent>

                {/* Maintenance Tab */}
                <TabsContent value="maintenance">
                  <MaintenanceHistory productId={id!} />
                </TabsContent>

                {/* Edit Tab */}
                {isEditMode && (
                  <TabsContent value="edit">
                    <ProductForm
                      product={product}
                      onSubmit={handleSubmit}
                      onCancel={handleCancelEdit}
                      isSubmitting={updateProduct.isPending}
                    />
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              <AlertDialogTitle>Archiver le produit</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Êtes-vous sûr de vouloir archiver{" "}
                  <strong className="text-foreground">{product.name}</strong> ?
                </p>
                <p>
                  Le produit ne sera plus visible dans le catalogue et ne pourra
                  plus être réservé.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProduct.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteProduct.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteProduct.isPending ? "Archivage..." : "Archiver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
