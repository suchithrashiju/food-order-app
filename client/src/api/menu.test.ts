import { describe, expect, it } from 'vitest'

import { mapMenuResponse } from '@/api/menu'

describe('mapMenuResponse', () => {
  it('maps a valid success payload from data', () => {
    const items = mapMenuResponse({
      success: true,
      data: [
        {
          id: '1',
          name: 'Margherita Pizza',
          description: 'Tomato, mozzarella, basil',
          price: 14,
          category: 'Pizza',
          isAvailable: true,
        },
      ],
      items: [],
      count: 1,
      total: 1,
    })

    expect(items).toHaveLength(1)
    expect(items[0]?.id).toBe('1')
    expect(items[0]?.name).toBe('Margherita Pizza')
  })

  it('falls back to items when data is missing', () => {
    const items = mapMenuResponse({
      success: true,
      items: [
        {
          id: '2',
          name: 'Veggie Salad',
          description: 'Fresh greens and avocado',
          price: 8.25,
          category: 'Salads',
          isAvailable: true,
        },
      ],
      count: 1,
      total: 1,
    })

    expect(items[0]?.id).toBe('2')
  })

  it('rejects invalid payloads', () => {
    expect(() => mapMenuResponse(null)).toThrow(/empty or invalid/i)
    expect(() => mapMenuResponse({ success: true })).toThrow(/items list/i)
    expect(() =>
      mapMenuResponse({
        success: true,
        data: [{ id: 1, name: 'Broken' }],
      }),
    ).toThrow(/invalid menu items/i)
  })
})
