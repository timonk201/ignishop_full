import { create } from 'zustand';
import axios from 'axios';

interface FavoriteStore {
  favorites: number[];
  fetchFavorites: () => Promise<void>;
  addToFavorites: (productId: number) => Promise<void>;
  removeFromFavorites: (productId: number) => Promise<void>;
  isInFavorites: (productId: number) => boolean;
}

export const useFavoriteStore = create<FavoriteStore>((set, get) => ({
  favorites: [],
  fetchFavorites: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get('http://localhost:8000/api/favorites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ favorites: response.data.data.map((item: any) => item.id) });
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  },
  addToFavorites: async (productId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.post(
        'http://localhost:8000/api/favorites',
        { product_id: productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      set((state) => ({ favorites: [...state.favorites, productId] }));
    } catch (error) {
      console.error('Error adding to favorites:', error);
      alert('Ошибка при добавлении в избранное.');
    }
  },
  removeFromFavorites: async (productId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.delete(`http://localhost:8000/api/favorites/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state) => ({
        favorites: state.favorites.filter((id) => id !== productId),
      }));
    } catch (error) {
      console.error('Error removing from favorites:', error);
      alert('Ошибка при удалении из избранного.');
    }
  },
  isInFavorites: (productId: number) => get().favorites.includes(productId),
}));