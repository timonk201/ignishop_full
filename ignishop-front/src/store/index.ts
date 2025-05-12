import { create } from 'zustand';

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  stock: number;
  image?: string; // URL или Base64 строка для картинки
};

type CartItem = {
  product: Product;
  quantity: number;
};

type Store = {
  products: Product[];
  cart: CartItem[];
  token: string | null;
  setProducts: (products: Product[]) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, quantity: number) => void;
  setToken: (token: string | null) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updatedProduct: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
};

export const useStore = create<Store>((set) => ({
  products: [
    { id: '1', name: 'Футболка', price: 20, description: 'Крутая футболка', stock: 10, image: '' },
    { id: '2', name: 'Джинсы', price: 50, description: 'Стильные джинсы', stock: 5, image: '' },
  ],
  cart: [],
  token: null,
  setProducts: (products) => set({ products }),
  addToCart: (product) =>
    set((state) => {
      const existingItem = state.cart.find((item) => item.product.id === product.id);
      if (existingItem) {
        return {
          cart: state.cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return { cart: [...state.cart, { product, quantity: 1 }] };
    }),
  removeFromCart: (id) => set((state) => ({ cart: state.cart.filter((item) => item.product.id !== id) })),
  updateCartQuantity: (id, quantity) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.product.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
      ),
    })),
  setToken: (token) => set({ token }),
  addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
  updateProduct: (id, updatedProduct) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updatedProduct } : p
      ),
    })),
  deleteProduct: (id) =>
    set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
}));