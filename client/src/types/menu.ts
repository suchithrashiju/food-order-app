export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
}

export interface MenuApiResponse {
  items: MenuItem[];
  total: number;
}
