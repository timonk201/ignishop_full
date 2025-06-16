'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  is_approved: boolean;
  category: {
    name: string;
  };
  subcategory: {
    name: string;
  } | null;
}

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/api/seller/products', {
          headers: { Authorization: `Bearer ${token}` },
        });
        let productsArr = [];
        if (Array.isArray(response.data)) {
          productsArr = response.data;
        } else if (Array.isArray(response.data.data)) {
          productsArr = response.data.data;
        } else if (response.data.products && Array.isArray(response.data.products)) {
          productsArr = response.data.products;
        }
        setProducts(productsArr);
      } catch (err) {
        setError('Ошибка при загрузке товаров: ' + (err as any)?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleDelete = async (productId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/seller/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      alert('Ошибка при удалении товара');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '18px', color: '#FF0000' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', color: '#003087', fontWeight: 'bold' }}>Мои товары</h1>
        <button
          onClick={() => router.push('/seller/products/add')}
          style={{
            backgroundColor: '#FF6200',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'semibold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.3s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e65a00')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF6200')}
        >
          <FaPlus size={16} /> Добавить товар
        </button>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#F9F9F9', borderRadius: '8px' }}>
          <p style={{ fontSize: '18px', color: '#666' }}>У вас пока нет товаров</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {product.image && (product.image.startsWith('http')
                ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: '100%', height: '120px', objectFit: 'contain', marginBottom: '12px', background: '#f8f8f8' }}
                  />
                ) : (
                  <img
                    src={product.image.startsWith('/storage/') ? `http://localhost:8000${product.image}` : `http://localhost:8000/storage/${product.image}`}
                    alt={product.name}
                    style={{ width: '100%', height: '120px', objectFit: 'contain', marginBottom: '12px', background: '#f8f8f8' }}
                  />
                ))}
              {!product.image && (
                <div
                  style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: '#F5F5F5',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                  }}
                >
                  Нет изображения
                </div>
              )}

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                  {product.name}
                </h3>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                  {product.category.name}
                  {product.subcategory && ` / ${product.subcategory.name}`}
                </p>
                <p style={{ fontSize: '16px', color: '#FF6200', fontWeight: 'bold', marginBottom: '8px' }}>
                  {product.price} $
                </p>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  В наличии: {product.stock} шт.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  {product.is_approved ? (
                    <span style={{ color: '#00A000', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FaCheck size={14} /> Подтвержден
                    </span>
                  ) : (
                    <span style={{ color: '#FF6200', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FaTimes size={14} /> На модерации
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => router.push(`/seller/products/edit/${product.id}`)}
                  style={{
                    flex: 1,
                    backgroundColor: '#003087',
                    color: '#FFFFFF',
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'background-color 0.3s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#002766')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#003087')}
                >
                  <FaEdit size={14} /> Редактировать
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  style={{
                    flex: 1,
                    backgroundColor: '#FF0000',
                    color: '#FFFFFF',
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'background-color 0.3s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#CC0000')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF0000')}
                >
                  <FaTrash size={14} /> Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 