// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (err) {
        if (err.response) {
          const errorMessage = err.response.data.message || 'Произошла ошибка при загрузке профиля.';
          setError(errorMessage);
        } else if (err.request) {
          setError('Не удалось подключиться к серверу. Проверьте, запущен ли сервер.');
        } else {
          setError('Произошла неизвестная ошибка. Проверьте консоль для деталей.');
        }
        console.error('Ошибка загрузки профиля:', err);
      }
    };

    fetchUser();
  }, [router]);

  if (!user && !error) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '16px' }}>
      <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333333', marginBottom: '24px' }}>
        Профиль
      </h2>
      <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <p><strong>Имя:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <button
          onClick={() => router.push('/orders')}
          style={{
            backgroundColor: '#FF6200',
            color: '#FFFFFF',
            padding: '12px',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'semibold',
            marginTop: '16px',
            transition: 'background-color 0.3s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e65a00')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF6200')}
        >
          Мои заказы
        </button>
      </div>
    </div>
  );
}