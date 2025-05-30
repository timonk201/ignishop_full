// app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('http://localhost:8000/api/register', {
        name,
        email,
        password,
        is_admin: false,
      });
      router.push('/login');
    } catch (err) {
      if (err.response) {
        const errorMessage = err.response.data.message || 'Произошла ошибка при регистрации.';
        const validationErrors = err.response.data.errors || {};
        const errorDetails = Object.values(validationErrors).flat().join(' ');
        setError(`${errorMessage} ${errorDetails}`);
      } else if (err.request) {
        setError('Не удалось подключиться к серверу. Проверьте, запущен ли сервер.');
      } else {
        setError('Произошла неизвестная ошибка. Проверьте консоль для деталей.');
      }
      console.error('Ошибка регистрации:', err);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '16px' }}>
      <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333333', marginBottom: '24px' }}>Регистрация</h2>
      <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>Имя:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none', color: '#333333', fontSize: '14px' }}
              required
            />
          </div>
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
            Зарегистрироваться
          </button>
        </form>
        <p style={{ fontSize: '14px', color: '#666666', textAlign: 'center', marginTop: '16px' }}>
          Уже есть аккаунт? <a href="/login" style={{ color: '#FF6200' }}>Войти</a>
        </p>
      </div>
    </div>
  );
}