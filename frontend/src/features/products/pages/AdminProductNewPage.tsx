import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProductForm, type ProductFormData } from '../components/ProductForm'
import { useCreateProduct } from '../hooks/useProductsAdmin'
import { ROUTES } from '@/constants/routes'

export function AdminProductNewPage() {
  const navigate = useNavigate()
  const createProduct = useCreateProduct()

  const handleSubmit = async (data: ProductFormData) => {
    try {
      const result = await createProduct.mutateAsync(data)
      // Navigate to the new product's detail page
      if (result.data.data?.id) {
        navigate(ROUTES.ADMIN_PRODUCT_DETAIL.replace(':id', result.data.data.id))
      } else {
        navigate(ROUTES.ADMIN_PRODUCTS)
      }
    } catch {
      // Error handled in hook
    }
  }

  const handleCancel = () => {
    navigate(ROUTES.ADMIN_PRODUCTS)
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button asChild variant="ghost">
          <Link to={ROUTES.ADMIN_PRODUCTS}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux produits
          </Link>
        </Button>
      </div>

      {/* Form Card */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Nouveau produit
          </CardTitle>
          <CardDescription>
            Créez un nouveau produit dans le catalogue. Vous pourrez ajouter des images après la création.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={createProduct.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
