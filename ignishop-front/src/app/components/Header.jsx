'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import SearchBar from './SearchBar';
import { useUser } from './../context/UserContext';
import { useCartStore } from '../../store/cartStore';
import { FaPlug, FaTshirt, FaBook, FaHome, FaDumbbell, FaSmile, FaGem, FaShoePrints, FaBriefcase, FaGamepad, FaBlender, FaCar } from 'react-icons/fa';

export default function Header() {
  const { user, refreshUser } = useUser();
  const { cart, fetchCart } = useCartStore();
  const [localUser, setLocalUser] = useState(user);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const router = useRouter();

  // Синхронизация локального состояния с контекстом
  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  // Загрузка корзины при монтировании
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Загрузка категорий
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/categories');
        setCategories(response.data.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Автоматический выбор первой категории при открытии каталога
  useEffect(() => {
    if (showCatalog && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    } else if (!showCatalog) {
      setSelectedCategory(null); // Сбрасываем выбор при закрытии каталога
    }
  }, [showCatalog, categories]);

  // Подсчет общего количества товаров в корзине
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

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
          refreshUser();
          setLocalUser(null);
          router.push('/login');
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

  // Закрытие каталога при клике вне области
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCatalog && !event.target.closest('.catalog-container')) {
        setShowCatalog(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showCatalog]);

  return (
    <header style={{ backgroundColor: '#003087', color: 'white', padding: '8px 16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'relative' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', textDecoration: 'none' }}>
          IgniShop
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1, margin: '0 16px', position: 'relative' }}>
          {/* Кнопка каталога */}
          <button
            onClick={() => setShowCatalog(!showCatalog)}
            style={{
              backgroundColor: '#ff6200',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              marginRight: '16px',
              transition: 'background-color 0.3s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e65a00')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ff6200')}
          >
            Каталог
          </button>

          {/* Поисковая строка */}
          <div style={{ flexGrow: 1 }}>
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Выдвигающийся каталог */}
          {showCatalog && (
            <div
              className="catalog-container"
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)', // Отступ от нижней границы хедера
                left: 0,
                width: '600px',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                display: 'flex',
                zIndex: 1000,
                overflow: 'hidden',
              }}
            >
              {/* Список категорий */}
              <div
                style={{
                  width: '250px',
                  backgroundColor: '#f5f5f5',
                  padding: '8px 0',
                  borderRight: '1px solid #e0e0e0',
                }}
              >
                {categories.map((category) => (
                  <div
                    key={category.id}
                    onMouseEnter={() => setSelectedCategory(category)}
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      backgroundColor: selectedCategory?.id === category.id ? '#ff6200' : 'transparent',
                      color: selectedCategory?.id === category.id ? 'white' : '#333333',
                      transition: 'background-color 0.3s, color 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px', // Отступ между иконкой и текстом
                    }}
                  >
                    {getCategoryIcon(category)} {category.name}
                  </div>
                ))}
              </div>

              {/* Подкатегории */}
              {selectedCategory && (
                <div style={{ flex: 1, padding: '8px 16px', backgroundColor: '#ffffff' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333333', marginBottom: '8px' }}>
                    {selectedCategory.name}
                  </h4>
                  {selectedCategory.subcategories.map((subcategory) => (
                    <div
                      key={subcategory.id}
                      style={{
                        padding: '4px 0',
                        color: '#666666',
                        cursor: 'pointer',
                        transition: 'color 0.3s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.color = '#ff6200')}
                      onMouseOut={(e) => (e.currentTarget.style.color = '#666666')}
                    >
                      {subcategory.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {localUser && (
            <>
              <Link
                href="/cart"
                style={{
                  position: 'relative',
                  backgroundColor: '#ff6200',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  textDecoration: 'none',
                }}
              >
                Корзина
                {cartItemCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      backgroundColor: '#FF0000',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {cartItemCount}
                  </span>
                )}
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

// Функция для получения иконок по ключу категории
function getCategoryIcon(category) {
  const icons = {
    electronics: <FaPlug />,
    clothing: <FaTshirt />,
    books: <FaBook />,
    home: <FaHome />,
    sports: <FaDumbbell />,
    beauty: <FaSmile />,
    jewelry: <FaGem />,
    shoes: <FaShoePrints />,
    bags: <FaBriefcase />,
    toys: <FaGamepad />,
    appliances: <FaBlender />,
    auto: <FaCar />,
  };
  return icons[category.key] || '📦';
}