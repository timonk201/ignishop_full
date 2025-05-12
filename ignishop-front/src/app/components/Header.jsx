'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SearchBar from './SearchBar';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import AuthModal from './AuthModal'; // Импортируем модальное окно

export default function Header() {
  const { user, openAuthModal, logout } = useAuthStore();
  const { cart } = useCartStore();
  const router = useRouter();

  const handleSearch = (query) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    logout();
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
        <div style={{ flexGrow: 1, margin: '0 16px' }}>
          <SearchBar onSearch={handleSearch} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            Корзина ({cart.length})
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
          {user ? (
            <>
              <span style={{ fontSize: '14px' }}>Привет, {user.email}</span>
              <button
                onClick={handleAdminPanel}
                style={{
                  backgroundColor: '#ff6200',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Админ
              </button>
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: '#666666',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Выйти
              </button>
            </>
          ) : (
            <button
              onClick={openAuthModal}
              style={{
                backgroundColor: '#ff6200',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Войти
            </button>
          )}
        </div>
      </div>
      <AuthModal /> {/* Добавляем модальное окно */}
    </header>
  );
}