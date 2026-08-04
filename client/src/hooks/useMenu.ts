import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '@/api/http'
import { getMenuItems } from '@/api/menu'
import type { MenuItem } from '@/types/menu'

export interface UseMenuResult {
  items: MenuItem[]
  categories: string[]
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useMenu(): UseMenuResult {
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategoryState] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const requestId = ++requestIdRef.current
    let cancelled = false

    const run = async (): Promise<void> => {
      try {
        const categoryFilter = selectedCategory === 'All' ? undefined : selectedCategory
        const nextItems = await getMenuItems(categoryFilter)

        if (cancelled || requestId !== requestIdRef.current) {
          return
        }

        setItems(nextItems)
        setError(null)

        if (selectedCategory === 'All') {
          const uniqueCategories = [...new Set(nextItems.map((item) => item.category))].sort((a, b) =>
            a.localeCompare(b),
          )
          setCategories(uniqueCategories)
        }
      } catch (err) {
        if (cancelled || requestId !== requestIdRef.current) {
          return
        }

        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to load menu'

        setItems([])
        setError(message)
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [selectedCategory])

  const setSelectedCategory = useCallback((category: string) => {
    setLoading(true)
    setError(null)
    setSelectedCategoryState(category)
  }, [])

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const requestId = ++requestIdRef.current

    try {
      const categoryFilter = selectedCategory === 'All' ? undefined : selectedCategory
      const nextItems = await getMenuItems(categoryFilter)

      if (requestId !== requestIdRef.current) {
        return
      }

      setItems(nextItems)

      if (selectedCategory === 'All') {
        const uniqueCategories = [...new Set(nextItems.map((item) => item.category))].sort((a, b) =>
          a.localeCompare(b),
        )
        setCategories(uniqueCategories)
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return
      }

      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load menu'

      setItems([])
      setError(message)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [selectedCategory])

  return {
    items,
    categories,
    selectedCategory,
    setSelectedCategory,
    loading,
    error,
    refetch,
  }
}
