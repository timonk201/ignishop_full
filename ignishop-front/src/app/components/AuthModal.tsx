'use client';

import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';

export default function AuthModal() {
  const { isAuthModalOpen, login, closeAuthModal } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
    router.push('/');
  };

  if (!isAuthModalOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        width: '300px',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>Вход</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              outline: 'none',
            }}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              outline: 'none',
            }}
            required
          />
          <button
            type="submit"
            style={{
              backgroundColor: '#ff6200',
              color: 'white',
              padding: '10px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Войти
          </button>
          <button
            type="button"
            onClick={closeAuthModal}
            style={{
              backgroundColor: '#666666',
              color: 'white',
              padding: '10px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Отмена
          </button>
        </form>
      </div>
    </div>
  );
}