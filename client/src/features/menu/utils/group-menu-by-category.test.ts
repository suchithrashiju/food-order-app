import { describe, expect, it } from 'vitest'

import {
  categorySectionId,
  groupMenuByCategory,
} from '@/features/menu/utils/group-menu-by-category'
import type { MenuItem } from '@/types'

function item(partial: Partial<MenuItem> & Pick<MenuItem, 'id' | 'name' | 'category'>): MenuItem {
  return {
    description: '',
    price: 10,
    isAvailable: true,
    rating: 4.5,
    preparationTime: 15,
    ...partial,
  }
}

describe('groupMenuByCategory', () => {
  it('groups items under sorted category headings', () => {
    const groups = groupMenuByCategory([
      item({ id: '1', name: 'Burger', category: 'Burgers' }),
      item({ id: '2', name: 'Cola', category: 'Drinks' }),
      item({ id: '3', name: 'Cheese Burger', category: 'Burgers' }),
      item({ id: '4', name: 'Pizza', category: 'Pizza' }),
    ])

    expect(groups.map((group) => group.category)).toEqual(['Burgers', 'Drinks', 'Pizza'])
    expect(groups[0]?.items.map((entry) => entry.name)).toEqual(['Burger', 'Cheese Burger'])
  })

  it('builds stable section ids', () => {
    expect(categorySectionId('Chicken Wraps')).toBe('category-chicken-wraps')
  })
})
