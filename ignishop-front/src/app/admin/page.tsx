'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheck, FaTimes, FaStore, FaUser } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  category_id: number;
  subcategory_id: number | null;
  category: { id: number; name: string };
  subcategory: { id: number; name: string } | null;
  description: string;
  price: number | string;
  stock: number;
  image?: string;
  created_at: string;
  updated_at: string;
  seller: {
    id: number;
    name: string;
    email: string;
  };
  is_approved: boolean;
}

export default function AdminPanel() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Загрузка списка товаров на подтверждение
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await axios.get('http://localhost:8000/api/admin/products/pending', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        let productsArr = [];
        if (Array.isArray(response.data)) {
          productsArr = response.data;
        } else if (Array.isArray(response.data.data)) {
          productsArr = response.data.data;
        } else if (response.data.products && Array.isArray(response.data.products)) {
          productsArr = response.data.products;
        }
        setProducts(productsArr.map((product: Product) => ({
          ...product,
          price: parseFloat(product.price as string),
        })));
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.push('/login');
        } else {
          setError('Ошибка при загрузке товаров: ' + (err as any)?.message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [router]);

  // Подтверждение товара
  const handleApprove = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      await axios.post(
        `http://localhost:8000/api/admin/products/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setProducts(products.filter(p => p.id !== id));
      alert('Товар успешно подтвержден!');
    } catch (error: any) {
      console.error('Error approving product:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      } else {
        alert('Не удалось подтвердить товар. Пожалуйста, попробуйте позже.');
      }
    }
  };

  // Отклонение товара
  const handleReject = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите отклонить этот товар?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        await axios.post(
          `http://localhost:8000/api/admin/products/${id}/reject`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setProducts(products.filter(p => p.id !== id));
        alert('Товар отклонен.');
      } catch (error: any) {
        console.error('Error rejecting product:', error);
        if (error.response?.status === 401) {
          router.push('/login');
        } else {
          alert('Не удалось отклонить товар. Пожалуйста, попробуйте позже.');
        }
      }
    }
  };

  // Выход из аккаунта
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
          window.dispatchEvent(new Event('storage'));
          router.push('/');
        })
        .catch((err) => {
          console.error('Ошибка при выходе:', err);
          setShowLogoutConfirm(false);
        });
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', textAlign: 'center' }}>
        <h2>Загрузка...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', textAlign: 'center' }}>
        <h2 style={{ color: '#ff0000' }}>{error}</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333333' }}>Панель администратора</h2>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          style={{
            backgroundColor: '#666666',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.3s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4A4A4A')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#666666')}
        >
          Выйти
        </button>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>
          Товары на подтверждение
        </h3>
        {(products || []).length === 0 ? (
          <p style={{ color: '#666666', textAlign: 'center', padding: '24px' }}>
            Нет товаров, ожидающих подтверждения
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {(products || []).map((product) => (
              <div
                key={product.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  transition: 'transform 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {product.image ? (
                  <img
                    src={product.image.startsWith('http')
                      ? product.image
                      : (product.image.startsWith('/storage/')
                        ? `http://localhost:8000${product.image}`
                        : `http://localhost:8000/storage/${product.image}`)}
                    alt={product.name}
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '200px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#666666' }}>Нет изображения</span>
                  </div>
                )}
                <div style={{ padding: '16px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333333', marginBottom: '8px' }}>
                    {product.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <FaStore style={{ color: '#FF6200' }} />
                    <span style={{ fontSize: '14px', color: '#666666' }}>
                      Продавец: {product.seller.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <FaUser style={{ color: '#666666' }} />
                    <span style={{ fontSize: '14px', color: '#666666' }}>
                      Email: {product.seller.email}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#666666', marginBottom: '8px' }}>
                    Категория: {product.category.name}
                  </p>
                  {product.subcategory && (
                    <p style={{ fontSize: '14px', color: '#666666', marginBottom: '8px' }}>
                      Подкатегория: {product.subcategory.name}
                    </p>
                  )}
                  <p style={{ fontSize: '14px', color: '#666666', marginBottom: '8px' }}>
                    Описание: {product.description}
                  </p>
                  <p style={{ fontSize: '14px', color: '#666666', marginBottom: '8px' }}>
                    Цена: ${typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(product.price).toFixed(2)}
                  </p>
                  <p style={{ fontSize: '14px', color: '#666666', marginBottom: '16px' }}>
                    На складе: {product.stock}
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleApprove(product.id)}
                      style={{
                        flex: 1,
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '20px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'background-color 0.3s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#45a049')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#4CAF50')}
                    >
                      <FaCheck /> Подтвердить
                    </button>
                    <button
                      onClick={() => handleReject(product.id)}
                      style={{
                        flex: 1,
                        backgroundColor: '#f44336',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '20px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'background-color 0.3s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#da190b')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f44336')}
                    >
                      <FaTimes /> Отклонить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showLogoutConfirm && (
        <div
          style={{
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
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              width: '400px',
              textAlign: 'center',
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>
              Подтверждение выхода
            </h3>
            <p style={{ color: '#666666', marginBottom: '24px' }}>Вы уверены, что хотите выйти из аккаунта?</p>
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
    </div>
  );
}