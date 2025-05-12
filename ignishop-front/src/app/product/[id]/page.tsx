// app/product/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useCartStore } from '../../../store/cartStore';

export interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number | string;
  stock: number;
  image?: string;
  created_at: string;
  updated_at: string;
}

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart, isInCart } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/products/${id}`);
        setProduct(response.data.data);
      } catch (err) {
        setError('Не удалось загрузить информацию о товаре.');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleBuyNow = async () => {
    if (product) {
      const added = await addToCart(product);
      if (added) {
        alert(`${product.name} добавлен в корзину!`);
        router.push('/cart');
      }
    }
  };

  if (loading) return <p style={{ textAlign: 'center', fontSize: '18px', color: '#333333' }}>Загрузка...</p>;
  if (error) return <p style={{ textAlign: 'center', fontSize: '18px', color: '#FF0000' }}>{error}</p>;
  if (!product) return <p style={{ textAlign: 'center', fontSize: '18px', color: '#333333' }}>Товар не найден.</p>;

  const inCart = isInCart(product.id);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '24px',
          display: 'flex',
          gap: '24px',
          transition: 'transform 0.3s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {/* Изображение слева */}
        <div style={{ flex: '0 0 400px' }}>
          {product.image ? (
            <img
              src={`http://localhost:8000${product.image}`}
              alt={product.name}
              style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '8px' }}
              onError={(e) => {
                console.error(`Failed to load image for ${product.name}: ${product.image}`);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '400px', backgroundColor: '#e0e0e0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {product.name}
            </div>
          )}
        </div>

        {/* Информация справа */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>{product.name}</h1>
          <p style={{ fontSize: '16px', color: '#666666', marginBottom: '16px' }}>
            Категория: {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
          </p>
          <p style={{ fontSize: '18px', color: '#333333', marginBottom: '16px' }}>{product.description}</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF6200', marginBottom: '16px' }}>
            Цена: {parseFloat(product.price as string).toFixed(2)} $
          </p>
          <p style={{ fontSize: '16px', color: '#333333', marginBottom: '16px' }}>
            На складе: {product.stock} единиц
          </p>
          <button
            onClick={handleBuyNow}
            style={{
              backgroundColor: inCart ? '#666666' : '#FF6200',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'semibold',
              transition: 'background-color 0.3s',
              marginBottom: '16px',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = inCart ? '#4A4A4A' : '#e65a00')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = inCart ? '#666666' : '#FF6200')}
          >
            {inCart ? 'В корзине' : 'Купить'}
          </button>
          <button
            onClick={() => router.push('/cart')}
            style={{
              backgroundColor: '#666666',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'semibold',
              transition: 'background-color 0.3s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4A4A4A')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#666666')}
          >
            Перейти в корзину
          </button>
        </div>
      </div>
    </div>
  );
}