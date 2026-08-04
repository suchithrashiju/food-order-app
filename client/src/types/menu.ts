export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
  isAvailable: boolean
}

export interface MenuApiResponse {
  success: boolean
  data: MenuItem[]
  items: MenuItem[]
  count: number
  total: number
}
