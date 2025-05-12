// src/store/productStore.ts
import { create } from 'zustand';

export interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number | string;
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
      set({ products: data.data.map((product: Product) => ({
        ...product,
        price: parseFloat(product.price as string),
      })) });
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  },
}));