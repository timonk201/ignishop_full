import { create } from 'zustand';

interface Category {
  id: number;
  key: string;
  name: string;
}

interface Subcategory {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  category_id: number;
  subcategory_id: number | null;
  category: Category;
  subcategory: Subcategory | null;
  description: string;
  price: number;
  stock: number;
  image?: string;
  created_at: string;
  updated_at: string;
}

interface ProductStore {
  products: Product[];
  setProducts: (products: Product[]) => void;
  fetchProducts: () => Promise<void>;
}

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  setProducts: (products) => set({ products }),
  fetchProducts: async () => {
    try {
      const response = await fetch('http://localhost:8000/api/products');
      const data = await response.json();
      set({ products: data.data.map((product: any) => ({
        ...product,
        price: parseFloat(product.price),
      })) });
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  },
}));