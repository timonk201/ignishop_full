// src/store/cartStore.ts
import { create } from 'zustand';
import axios from 'axios';

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

interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  cart: CartItem[];
  addToCart: (product: Product) => Promise<boolean>;
  isInCart: (id: number) => boolean;
  updateQuantity: (id: number, quantity: number) => void;
  removeFromCart: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: [],
  addToCart: async (product: Product) => {
    const existingItem = get().cart.find((item) => item.id === product.id);
    if (existingItem) {
      // Товар уже в корзине, не добавляем
      return false;
    }

    set((state) => {
      const newQuantity = 1;
      if (newQuantity > product.stock) {
        alert(`Нельзя добавить больше ${product.stock} единиц, так как на складе осталось только ${product.stock}.`);
        return { cart: state.cart };
      }
      const updatedCart = [...state.cart, { ...product, quantity: newQuantity }];
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return { cart: updatedCart };
    });

    await axios.post('http://localhost:8000/api/cart', {
      product_id: product.id,
      quantity: 1,
    });
    return true;
  },
  isInCart: (id: number) => {
    return get().cart.some((item) => item.id === id);
  },
  updateQuantity: (id: number, quantity: number) => {
    set((state) => {
      const item = state.cart.find((item) => item.id === id);
      if (!item) return { cart: state.cart };
      const maxQuantity = item.stock || Infinity;
      if (quantity > maxQuantity) {
        alert(`Нельзя выбрать больше ${maxQuantity} единиц, так как на складе осталось только ${maxQuantity}.`);
        return { cart: state.cart };
      }
      const updatedCart = state.cart.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, Math.min(quantity, maxQuantity)) } : item
      );
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return { cart: updatedCart };
    });
    const item = get().cart.find((item) => item.id === id);
    if (item) {
      axios.put(`http://localhost:8000/api/cart/${id}`, { quantity: item.quantity });
    }
  },
  removeFromCart: async (id: number) => {
    set((state) => {
      const updatedCart = state.cart.filter((item) => item.id !== id);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return { cart: updatedCart };
    });
    await axios.delete(`http://localhost:8000/api/cart/${id}`);
  },
  clearCart: async () => {
    try {
      const cartItems = get().cart;
      for (const item of cartItems) {
        await axios.delete(`http://localhost:8000/api/cart/${item.id}`);
      }
      set({ cart: [] });
      localStorage.removeItem('cart');
    } catch (error) {
      console.error('Error clearing cart:', error);
      alert('Ошибка при очистке корзины. Попробуйте снова.');
    }
  },
  fetchCart: async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/cart');
      const serverCart = response.data.data.map((item: any) => ({
        ...item.product,
        quantity: item.quantity,
      }));
      set({ cart: serverCart });
      localStorage.setItem('cart', JSON.stringify(serverCart));
    } catch (error) {
      console.error('Error fetching cart:', error);
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        set({ cart: JSON.parse(savedCart) });
      }
    }
  },
}));

// Инициализация при загрузке
useCartStore.getState().fetchCart();