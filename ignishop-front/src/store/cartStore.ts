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
  addToCart: (product: Product) => Promise<boolean>;
  isInCart: (id: number) => boolean;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  removeFromCart: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: [],
  addToCart: async (product: Product) => {
    const existingItem = get().cart.find((item) => item.id === product.id);
    let quantity = product.quantity || 1;

    if (quantity > product.stock) {
      alert(`Нельзя добавить больше ${product.stock} единиц, так как на складе осталось только ${product.stock}.`);
      return false;
    }

    if (existingItem) {
      quantity = existingItem.quantity + quantity;
      try {
        await axios.put(`http://localhost:8000/api/cart/${product.id}`, { quantity });
        set((state) => {
          const updatedCart = state.cart.map((item) =>
            item.id === product.id ? { ...item, quantity } : item
          );
          if (typeof window !== 'undefined') {
            localStorage.setItem('cart', JSON.stringify(updatedCart));
          }
          return { cart: updatedCart };
        });
        return true;
      } catch (error) {
        console.error('Error updating quantity on server:', error);
        return false;
      }
    }

    set((state) => {
      const updatedCart = [...state.cart, { ...product, quantity }];
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      }
      return { cart: updatedCart };
    });

    try {
      await axios.post('http://localhost:8000/api/cart', {
        product_id: product.id,
        quantity: quantity,
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
  updateQuantity: async (id: number, quantity: number) => {
    let newQuantity = quantity;
    let previousQuantity: number | null = null;

    set((state) => {
      const item = state.cart.find((item) => item.id === id);
      if (!item) return { cart: state.cart };
      previousQuantity = item.quantity; // Сохраняем текущее количество
      const maxQuantity = item.stock || Infinity;
      if (quantity > maxQuantity) {
        alert(`Нельзя выбрать больше ${maxQuantity} единиц, так как на складе осталось только ${maxQuantity}.`);
        newQuantity = maxQuantity;
      }
      if (quantity < 1) {
        newQuantity = 1;
      }
      const updatedCart = state.cart.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      }
      return { cart: updatedCart };
    });

    try {
      await axios.put(`http://localhost:8000/api/cart/${id}`, { quantity: newQuantity });
    } catch (error) {
      console.error('Error updating quantity on server:', error);
      // Откатываем состояние, если сервер не обновился
      set((state) => {
        const updatedCart = state.cart.map((item) =>
          item.id === id && previousQuantity !== null ? { ...item, quantity: previousQuantity } : item
        );
        if (typeof window !== 'undefined') {
          localStorage.setItem('cart', JSON.stringify(updatedCart));
        }
        return { cart: updatedCart };
      });
      throw error;
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
        price: parseFloat(item.product.price),
      }));
      set((state) => {
        const updatedCart = state.cart.map((localItem) => {
          const serverItem = serverCart.find((item: CartItem) => item.id === localItem.id);
          return serverItem ? { ...localItem, quantity: serverItem.quantity } : localItem;
        });
        serverCart.forEach((serverItem: CartItem) => {
          if (!updatedCart.find((item) => item.id === serverItem.id)) {
            updatedCart.push(serverItem);
          }
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem('cart', JSON.stringify(updatedCart));
        }
        return { cart: updatedCart };
      });
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (typeof window !== 'undefined') {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
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