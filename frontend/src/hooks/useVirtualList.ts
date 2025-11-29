import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useCallback } from 'react'

interface UseVirtualListOptions<T> {
  items: T[]
  estimateSize: number
  overscan?: number
  enabled?: boolean
}

export function useVirtualList<T>({
  items,
  estimateSize,
  overscan = 5,
  enabled = true,
}: UseVirtualListOptions<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: enabled ? items.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  const scrollToIndex = useCallback(
    (index: number) => {
      virtualizer.scrollToIndex(index, { align: 'start' })
    },
    [virtualizer]
  )

  return {
    parentRef,
    virtualizer,
    virtualItems,
    totalSize,
    scrollToIndex,
    // Helper to get the actual item from virtual item
    getItem: (virtualIndex: number) => items[virtualItems[virtualIndex]?.index ?? 0],
  }
}
