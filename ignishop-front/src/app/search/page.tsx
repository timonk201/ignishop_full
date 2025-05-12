// app/search/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useCartStore } from '../../store/cartStore';
import { useRouter, useSearchParams } from 'next/navigation';

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

export default function SearchPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const { addToCart, isInCart } = useCartStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/products?search=${encodeURIComponent(query)}`);
        const fetchedProducts = response.data.data.map((product: Product) => ({
          ...product,
          price: parseFloat(product.price as string),
        }));
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        alert('Не удалось загрузить товары.');
        const allProductsResponse = await axios.get('http://localhost:8000/api/products');
        const allProducts = allProductsResponse.data.data.map((product: Product) => ({
          ...product,
          price: parseFloat(product.price as string),
        }));
        const filteredProducts = allProducts.filter((product) =>
          product.name.toLowerCase().includes(query.toLowerCase())
        );
        setProducts(filteredProducts);
      }
    };
    fetchProducts();
  }, [query]);

  const handleAddToCart = async (product: Product) => {
    const added = await addToCart(product);
    if (added) {
      alert(`${product.name} добавлен в корзину!`);
      router.push('/cart');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>
        Результаты поиска: {query || 'все товары'}
      </h2>
      {products.length === 0 && query && (
        <p style={{ textAlign: 'center', fontSize: '18px', color: '#333333' }}>Товары не найдены.</p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {products.map((product) => {
          const inCart = isInCart(product.id);
          return (
            <div
              key={product.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                transition: 'transform 0.3s',
                cursor: 'pointer',
              }}
              onClick={() => router.push(`/product/${product.id}`)}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {product.image ? (
                <img
                  src={`http://localhost:8000${product.image}`}
                  alt={product.name}
                  style={{ width: '100%', height: '12rem', objectFit: 'cover', borderRadius: '8px 8px 0 0' }}
                  onError={(e) => console.error(`Failed to load image for ${product.name}: ${product.image}`)}
                />
              ) : (
                <div style={{ height: '12rem', backgroundColor: '#e0e0e0', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {product.name}
                </div>
              )}
              <div style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333333', marginBottom: '8px' }}>{product.name}</h4>
                <p style={{ fontSize: '14px', color: '#666666', marginBottom: '16px' }}>{product.category.charAt(0).toUpperCase() + product.category.slice(1)}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                  style={{
                    width: '100',
                    backgroundColor: inCart ? '#666666' : '#ff6200',
                    color: 'white',
                    padding: '8px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: '8px',
                    transition: 'background-color 0.3s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = inCart ? '#4A4A4A' : '#e65a00')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = inCart ? '#666666' : '#ff6200')}
                >
                  {inCart ? 'В корзине' : 'Добавить в корзину'}
                </button>
                <p
                  style={{
                    width: '100',
                    textAlign: 'center',
                    fontSize: '16px',
                    color: '#333333',
                    padding: '8px 0',
                  }}
                >
                  Цена: {product.price} $
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}