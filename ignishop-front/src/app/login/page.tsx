// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useUser } from './../context/UserContext';

export default function LoginPage() {
  const { refreshUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:8000/api/login', {
        email,
        password,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      await refreshUser();
      router.push('/');
    } catch (err) {
      if (err.response) {
        const errorMessage = err.response.data.message || 'Произошла ошибка при входе.';
        setError(errorMessage);
      } else if (err.request) {
        setError('Не удалось подключиться к серверу. Проверьте, запущен ли сервер.');
      } else {
        setError('Произошла неизвестная ошибка. Проверьте консоль для деталей.');
      }
      console.error('Ошибка входа:', err);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '16px' }}>
      <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333333', marginBottom: '24px' }}>Вход</h2>
      <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none', color: '#333333', fontSize: '14px' }}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>Пароль:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none', color: '#333333', fontSize: '14px' }}
              required
            />
          </div>
          {error && <p style={{ color: '#FF0000', fontSize: '14px' }}>{error}</p>}
          <button
            type="submit"
            style={{
              backgroundColor: '#FF6200',
              color: '#FFFFFF',
              padding: '12px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'semibold',
              transition: 'background-color 0.3s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e65a00')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF6200')}
          >
            Войти
          </button>
        </form>
        <p style={{ fontSize: '14px', color: '#666666', textAlign: 'center', marginTop: '16px' }}>
          Нет аккаунта? <a href="/register" style={{ color: '#FF6200' }}>Зарегистрироваться</a>
        </p>
      </div>
    </div>
  );
}