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
  quantity?: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  cart: CartItem[];
  localCart: CartItem[];
  addToCart: (product: Product, user: any) => Promise<boolean>;
  isInCart: (id: number) => boolean;
  updateQuantity: (id: number, quantity: number, user: any) => Promise<void>;
  removeFromCart: (id: number, user: any) => Promise<void>;
  clearCart: (user: any) => Promise<void>;
  fetchCart: (user: any) => Promise<void>;
  syncLocalCart: (user: any) => Promise<void>;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: [],
  localCart: [],

  addToCart: async (product: Product, user: any) => {
    const quantity = product.quantity || 1;

    if (quantity > product.stock) {
      alert(`Нельзя добавить больше ${product.stock} единиц, так как на складе осталось только ${product.stock}.`);
      return false;
    }

    if (!user) {
      const existingItem = get().localCart.find((item) => item.id === product.id);
      if (existingItem) {
        set((state) => ({
          localCart: state.localCart.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
          ),
        }));
      } else {
        set((state) => ({
          localCart: [...state.localCart, { ...product, quantity }],
        }));
      }
      return true;
    }

    const existingItem = get().cart.find((item) => item.id === product.id);
    let newQuantity = quantity;

    if (existingItem) {
      newQuantity = existingItem.quantity + quantity;
      try {
        await axios.put(
          `http://localhost:8000/api/cart/${product.id}`,
          { quantity: newQuantity },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === product.id ? { ...item, quantity: newQuantity } : item
          ),
        }));
        return true;
      } catch (error) {
        console.error('Error updating quantity on server:', error);
        return false;
      }
    }

    try {
      await axios.post(
        'http://localhost:8000/api/cart',
        { product_id: product.id, quantity },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      set((state) => ({
        cart: [...state.cart, { ...product, quantity }],
      }));
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  },

  isInCart: (id: number) => {
    const { cart, localCart } = get();
    return cart.some((item) => item.id === id) || localCart.some((item) => item.id === id);
  },

  updateQuantity: async (id: number, quantity: number, user: any) => {
    let newQuantity = quantity;
    let previousQuantity: number | null = null;

    if (!user) {
      set((state) => {
        const item = state.localCart.find((item) => item.id === id);
        if (!item) return { localCart: state.localCart };
        previousQuantity = item.quantity;
        const maxQuantity = item.stock || Infinity;
        if (quantity > maxQuantity) {
          alert(`Нельзя выбрать больше ${maxQuantity} единиц, так как на складе осталось только ${maxQuantity}.`);
          newQuantity = maxQuantity;
        }
        if (quantity < 1) {
          newQuantity = 1;
        }
        return {
          localCart: state.localCart.map((item) =>
            item.id === id ? { ...item, quantity: newQuantity } : item
          ),
        };
      });
      return;
    }

    set((state) => {
      const item = state.cart.find((item) => item.id === id);
      if (!item) return { cart: state.cart };
      previousQuantity = item.quantity;
      const maxQuantity = item.stock || Infinity;
      if (quantity > maxQuantity) {
        alert(`Нельзя выбрать больше ${maxQuantity} единиц, так как на складе осталось только ${maxQuantity}.`);
        newQuantity = maxQuantity;
      }
      if (quantity < 1) {
        newQuantity = 1;
      }
      return {
        cart: state.cart.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        ),
      };
    });

    try {
      await axios.put(
        `http://localhost:8000/api/cart/${id}`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
    } catch (error) {
      console.error('Error updating quantity on server:', error);
      set((state) => ({
        cart: state.cart.map((item) =>
          item.id === id && previousQuantity !== null ? { ...item, quantity: previousQuantity } : item
        ),
      }));
      throw error;
    }
  },

  removeFromCart: async (id: number, user: any) => {
    if (!user) {
      set((state) => ({
        localCart: state.localCart.filter((item) => item.id !== id),
      }));
      return;
    }

    set((state) => ({
      cart: state.cart.filter((item) => item.id !== id),
    }));
    try {
      await axios.delete(`http://localhost:8000/api/cart/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  },

  clearCart: async (user: any) => {
    if (!user) {
      set({ localCart: [] });
      return;
    }

    try {
      await axios.delete('http://localhost:8000/api/cart/clear', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      set({ cart: [] });
    } catch (error) {
      console.error('Error clearing cart:', error);
      set({ cart: [] }); // Очищаем локально, чтобы UI обновился
    }
  },

  fetchCart: async (user: any) => {
    if (!user) {
      return;
    }

    try {
      const response = await axios.get('http://localhost:8000/api/cart', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const serverCart = response.data.data.map((item: any) => ({
        ...item.product,
        quantity: item.quantity,
        price: parseFloat(item.product.price),
      }));
      set({ cart: serverCart });
    } catch (error) {
      console.error('Error fetching cart:', error);
      set({ cart: [] });
    }
  },

  syncLocalCart: async (user: any) => {
    if (!user) return;

    const localCart = get().localCart;
    if (localCart.length === 0) {
      await get().fetchCart(user);
      return;
    }

    for (const item of localCart) {
      try {
        await axios.post(
          'http://localhost:8000/api/cart',
          { product_id: item.id, quantity: item.quantity },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
      } catch (error) {
        console.error(`Error syncing cart item ${item.id}:`, error);
      }
    }

    set({ localCart: [] });
    await get().fetchCart(user);
  },
}));