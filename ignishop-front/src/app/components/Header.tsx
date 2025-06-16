'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import SearchBar from './SearchBar';
import { useUser } from '../context/UserContext';
import { useCartStore } from '../../store/cartStore';
import { FaPlug, FaTshirt, FaBook, FaHome, FaDumbbell, FaSmile, FaGem, FaShoePrints, FaBriefcase, FaGamepad, FaBlender, FaCar } from 'react-icons/fa';

interface Category {
  id: number;
  key: string;
  name: string;
  subcategories: { id: number; name: string }[];
}

interface CartItem {
  id: number;
  quantity: number;
}

interface User {
  id?: number;
  name: string;
  email: string;
  avatar?: string;
  is_admin?: boolean;
}

export default function Header() {
  const { user, refreshUser } = useUser();
  const { cart, fetchCart } = useCartStore();
  const [localUser, setLocalUser] = useState<User | null>(user);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const router = useRouter();

  const updateUserFromStorage = () => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token) {
      setLocalUser(null);
      return;
    }

    if (user) {
      setLocalUser(user);
    } else if (storedUser) {
      setLocalUser(JSON.parse(storedUser));
    } else {
      setLocalUser(null);
    }
  };

  useEffect(() => {
    updateUserFromStorage();
  }, [user, router.asPath]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = () => {
      updateUserFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

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

  useEffect(() => {
    if (showCatalog && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    } else if (!showCatalog) {
      setSelectedCategory(null);
    }
  }, [showCatalog, categories]);

  const cartItemCount = cart.reduce((total: number, item: CartItem) => total + item.quantity, 0);

  const handleSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleAdminPanel = () => {
    router.push('/admin');
  };

  const handleImageError = () => {
    return false;
  };

  const handleCategoryClick = (category: Category) => {
    setShowCatalog(false);
    router.push(`/category/${category.key}`);
  };

  const handleSubcategoryClick = (category: Category, subcategory: { id: number; name: string }) => {
    setShowCatalog(false);
    router.push(`/category/${category.key}?subcategory=${encodeURIComponent(subcategory.name)}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img
            src="/phoenix.png"
            alt="IgniShop Logo"
            style={{
              width: '40px',
              height: '40px',
              marginRight: '8px',
              objectFit: 'contain',
            }}
          />
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>IgniShop</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', flexGrow: '1', margin: '0 16px', position: 'relative' }}>
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

          <div style={{ flexGrow: 1 }}>
            <SearchBar onSearch={handleSearch} />
          </div>

          {showCatalog && (
            <div
              className="catalog-container"
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
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
                    onClick={() => handleCategoryClick(category)}
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      backgroundColor: selectedCategory?.id === category.id ? '#ff6200' : 'transparent',
                      color: selectedCategory?.id === category.id ? 'white' : '#333333',
                      transition: 'background-color 0.3s, color 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {getCategoryIcon(category)} {category.name}
                  </div>
                ))}
              </div>

              {selectedCategory && (
                <div style={{ flex: 1, padding: '8px 16px', backgroundColor: '#ffffff' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333333', marginBottom: '8px' }}>
                    {selectedCategory.name}
                  </h4>
                  {selectedCategory.subcategories.map((subcategory) => (
                    <div
                      key={subcategory.id}
                      onClick={() => handleSubcategoryClick(selectedCategory, subcategory)}
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
                <Link href="/profile">
                  {localUser.avatar ? (
                    <img
                      src={localUser.avatar.startsWith('http') ? localUser.avatar : `http://localhost:8000/storage/${localUser.avatar}`}
                      alt="User Avatar"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #ff6200',
                        transition: 'border-color 0.3s',
                      }}
                      onError={handleImageError}
                      onMouseOver={(e) => (e.currentTarget.style.borderColor = '#e65a00')}
                      onMouseOut={(e) => (e.currentTarget.style.borderColor = '#ff6200')}
                    />
                  ) : (
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#E0E0E0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #ff6200',
                        transition: 'border-color 0.3s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.borderColor = '#e65a00')}
                      onMouseOut={(e) => (e.currentTarget.style.borderColor = '#ff6200')}
                    >
                      <span style={{ fontSize: '20px', color: '#666666' }}>👤</span>
                    </div>
                  )}
                </Link>
              )}
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
    </header>
  );
}

function getCategoryIcon(category: Category) {
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