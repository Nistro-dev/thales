import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/api/products.api'
import type { ProductFilters } from '@/types'

export function useProducts(filters: ProductFilters = {}, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['products', filters, page, limit],
    queryFn: async () => {
      const response = await productsApi.list(filters, page, limit)
      return response.data
    },
  })
}
