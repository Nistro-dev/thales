import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Tag,
  Clock,
  FileText,
  History,
  MoreVertical,
  CheckCircle,
  XCircle,
  Wrench,
  Archive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ProductStatusBadge } from '../components/ProductStatusBadge'
import { ProductForm, type ProductFormData } from '../components/ProductForm'
import { ProductFilesList } from '../components/ProductFilesList'
import { ImageUpload } from '../components/ImageUpload'
import { ProductMovementsList } from '../components/ProductMovementsList'
import { ProductGallery } from '../components/ProductGallery'
import {
  useProductAdmin,
  useProductFilesAdmin,
  useProductMovements,
  useUpdateProduct,
  useDeleteProduct,
  useUpdateProductStatus,
} from '../hooks/useProductsAdmin'
import { ROUTES } from '@/constants/routes'
import type { ProductStatus } from '@/types'

export function AdminProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isEditMode = searchParams.get('edit') === 'true'

  const { data: product, isLoading, isError } = useProductAdmin(id)
  const { data: files, isLoading: filesLoading } = useProductFilesAdmin(id)
  const { data: movements, isLoading: movementsLoading } = useProductMovements(id)

  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()
  const updateStatus = useUpdateProductStatus()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  // Switch to details tab when exiting edit mode
  useEffect(() => {
    if (!isEditMode && activeTab === 'edit') {
      setActiveTab('details')
    }
  }, [isEditMode, activeTab])

  const handleEditClick = () => {
    setSearchParams({ edit: 'true' })
    setActiveTab('edit')
  }

  const handleCancelEdit = () => {
    setSearchParams({})
  }

  const handleSubmit = async (data: ProductFormData) => {
    if (!id) return
    try {
      await updateProduct.mutateAsync({ id, data })
      setSearchParams({})
    } catch {
      // Error handled in hook
    }
  }

  const handleStatusChange = async (status: ProductStatus) => {
    if (!id) return
    await updateStatus.mutateAsync({ id, status })
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteProduct.mutateAsync(id)
      navigate(ROUTES.ADMIN_PRODUCTS)
    } catch {
      // Error handled in hook
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-10 w-32 mb-6" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Skeleton className="aspect-square w-full rounded-lg" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
          <p className="text-destructive">Produit introuvable</p>
          <Button asChild variant="link" className="mt-4">
            <Link to={ROUTES.ADMIN_PRODUCTS}>Retour aux produits</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button asChild variant="ghost">
          <Link to={ROUTES.ADMIN_PRODUCTS}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux produits
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {!isEditMode && (
            <>
              <Button variant="outline" onClick={handleEditClick}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              {product.status !== 'ARCHIVED' && (
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Archiver
                </Button>
              )}
            </>
          )}
        </div>
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
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Statut</span>
                <div className="flex items-center gap-2">
                  <ProductStatusBadge status={product.status} />
                  {!isEditMode && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleStatusChange('AVAILABLE')}
                          disabled={product.status === 'AVAILABLE'}
                        >
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Disponible
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange('UNAVAILABLE')}
                          disabled={product.status === 'UNAVAILABLE'}
                        >
                          <XCircle className="h-4 w-4 mr-2 text-red-600" />
                          Indisponible
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange('MAINTENANCE')}
                          disabled={product.status === 'MAINTENANCE'}
                        >
                          <Wrench className="h-4 w-4 mr-2 text-orange-600" />
                          Maintenance
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange('ARCHIVED')}
                          disabled={product.status === 'ARCHIVED'}
                        >
                          <Archive className="h-4 w-4 mr-2 text-gray-600" />
                          Archivé
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prix</span>
                <span className="font-medium">{product.priceCredits} crédits/jour</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Durée</span>
                <span className="text-sm">
                  {product.minDuration} - {product.maxDuration} jours
                </span>
              </div>

              {product.reference && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Référence</span>
                  <span className="text-sm font-mono">{product.reference}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Section</span>
                <div className="text-sm text-right">
                  <div>{product.section.name}</div>
                  {product.subSection && (
                    <div className="text-muted-foreground">{product.subSection.name}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Card>
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
              <Tabs value={isEditMode ? 'edit' : activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="details" disabled={isEditMode}>
                    <Tag className="h-4 w-4 mr-2" />
                    Détails
                  </TabsTrigger>
                  <TabsTrigger value="files" disabled={isEditMode}>
                    <FileText className="h-4 w-4 mr-2" />
                    Fichiers ({files?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="movements" disabled={isEditMode}>
                    <History className="h-4 w-4 mr-2" />
                    Mouvements
                  </TabsTrigger>
                  {isEditMode && (
                    <TabsTrigger value="edit">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-6">
                  {/* Attributes */}
                  {product.attributes && product.attributes.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Caractéristiques</h3>
                      <div className="grid gap-2">
                        {product.attributes.map((attr) => (
                          <div
                            key={attr.id}
                            className="flex justify-between py-2 border-b last:border-0"
                          >
                            <span className="text-muted-foreground capitalize">{attr.key}</span>
                            <span className="font-medium">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last movement info */}
                  {product.lastMovementAt && (
                    <div>
                      <h3 className="font-semibold mb-3">Dernier mouvement</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(product.lastMovementAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {product.lastCondition && (
                          <Badge
                            variant={product.lastCondition === 'OK' ? 'default' : 'destructive'}
                          >
                            {product.lastCondition}
                          </Badge>
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
                  Êtes-vous sûr de vouloir archiver{' '}
                  <strong className="text-foreground">{product.name}</strong> ?
                </p>
                <p>
                  Le produit ne sera plus visible dans le catalogue et ne pourra plus être réservé.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProduct.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteProduct.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteProduct.isPending ? 'Archivage...' : 'Archiver'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
