// src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: { email: string; role: string } | null;
  isAuthModalOpen: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthModalOpen: false,
  login: async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json', // Добавляем заголовок Accept
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        set({ user: { email, role: 'admin' }, isAuthModalOpen: false });
      } else {
        throw new Error(data.message || 'Неверные учетные данные');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Ошибка авторизации: ' + (error as Error).message);
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null });
  },
  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
}));