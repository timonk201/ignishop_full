// src/app/components/Header.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import SearchBar from './SearchBar';
import { useUser } from './../context/UserContext';

export default function Header() {
  const { user, refreshUser } = useUser();
  const [localUser, setLocalUser] = useState(user); // Локальное состояние для немедленного обновления
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const router = useRouter();

  // Синхронизация локального состояния с контекстом
  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  const handleSearch = (query) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleLogout = () => {
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .post(
          'http://localhost:8000/api/logout',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(() => {
          setShowLogoutConfirm(false);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          refreshUser(); // Обновляем состояние в контексте
          setLocalUser(null); // Немедленно обновляем локальное состояние
          router.push('/login'); // Перенаправляем на страницу авторизации
        })
        .catch((err) => {
          console.error('Ошибка при выходе:', err);
          setShowLogoutConfirm(false);
        });
    }
  };

  const handleAdminPanel = () => {
    router.push('/admin');
  };

  return (
    <header style={{ backgroundColor: '#003087', color: 'white', padding: '8px 16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', textDecoration: 'none' }}>
          IgniShop
        </Link>
        <div style={{ flexGrow: '1', margin: '0 16px' }}>
          <SearchBar onSearch={handleSearch} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {localUser && (
            <>
              <Link
                href="/cart"
                style={{
                  backgroundColor: '#ff6200',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  textDecoration: 'none',
                }}
              >
                Корзина
              </Link>
              <Link
                href="/orders"
                style={{
                  backgroundColor: '#ff6200',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  textDecoration: 'none',
                }}
              >
                Заказы
              </Link>
            </>
          )}
          {localUser ? (
            <>
              <span style={{ fontSize: '14px' }}>Привет, {localUser.name}</span>
              {localUser.is_admin ? (
                <button
                  onClick={handleAdminPanel}
                  style={{
                    backgroundColor: '#ff6200',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e65a00')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ff6200')}
                >
                  Админ
                </button>
              ) : (
                <Link
                  href="/profile"
                  style={{
                    backgroundColor: '#ff6200',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    textDecoration: 'none',
                  }}
                >
                  Профиль
                </Link>
              )}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                style={{
                  backgroundColor: '#666666',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4A4A4A')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#666666')}
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{
                  backgroundColor: '#ff6200',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  textDecoration: 'none',
                }}
              >
                Войти
              </Link>
              <Link
                href="/register"
                style={{
                  backgroundColor: '#ff6200',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  textDecoration: 'none',
                }}
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>

      {showLogoutConfirm && (
        <div
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center',
              maxWidth: '400px',
              width: '90%',
            }}
          >
            <h3 style={{ fontSize: '20px', color: '#333333', marginBottom: '16px' }}>
              Подтверждение выхода
            </h3>
            <p style={{ fontSize: '14px', color: '#666666', marginBottom: '24px' }}>
              Вы уверены, что хотите выйти?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: '#FF6200',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'semibold',
                  transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e65a00')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF6200')}
              >
                Да, выйти
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  backgroundColor: '#666666',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4A4A4A')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#666666')}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}