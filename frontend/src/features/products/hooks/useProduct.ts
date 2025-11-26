import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/api/products.api'

export function useProduct(id: string, admin = false) {
  return useQuery({
    queryKey: ['product', id, admin],
    queryFn: async () => {
      const response = admin
        ? await productsApi.getAdmin(id)
        : await productsApi.get(id)
      return response.data.data
    },
    enabled: !!id,
  })
}
