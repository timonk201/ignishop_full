import { create } from 'zustand';
import axios from 'axios';

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
      return false;
    }

    set((state) => {
      const newQuantity = 1;
      if (newQuantity > product.stock) {
        alert(`Нельзя добавить больше ${product.stock} единиц, так как на складе осталось только ${product.stock}.`);
        return { cart: state.cart };
      }
      const updatedCart = [...state.cart, { ...product, quantity: newQuantity }];
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      }
      return { cart: updatedCart };
    });

    try {
      await axios.post('http://localhost:8000/api/cart', {
        product_id: product.id,
        quantity: 1,
      });
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
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
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      }
      return { cart: updatedCart };
    });
    const item = get().cart.find((item) => item.id === id);
    if (item) {
      axios.put(`http://localhost:8000/api/cart/${id}`, { quantity: item.quantity }).catch((error) => {
        console.error('Error updating quantity on server:', error);
      });
    }
  },
  removeFromCart: async (id: number) => {
    set((state) => {
      const updatedCart = state.cart.filter((item) => item.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      }
      return { cart: updatedCart };
    });
    try {
      await axios.delete(`http://localhost:8000/api/cart/${id}`);
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  },
  clearCart: async () => {
    try {
      const cartItems = get().cart;
      for (const item of cartItems) {
        await axios.delete(`http://localhost:8000/api/cart/${item.id}`);
      }
      set({ cart: [] });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart');
      }
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
        price: parseFloat(item.product.price), // Убедимся, что price - число
      }));
      set({ cart: serverCart });
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(serverCart));
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (typeof window !== 'undefined') {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          // Убедимся, что price - число для всех элементов
          const normalizedCart = parsedCart.map((item: CartItem) => ({
            ...item,
            price: parseFloat(item.price as any),
          }));
          set({ cart: normalizedCart });
        }
      }
    }
  },
}));