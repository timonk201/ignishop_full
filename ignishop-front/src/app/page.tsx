'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useCartStore } from '../store/cartStore';
import { useRouter } from 'next/navigation';

interface Category {
  id: number;
  key: string;
  name: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  category: { key: string; name: string };
  subcategory: { name: string } | null;
  description: string;
  price: number | string;
  stock: number;
  image?: string;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const { addToCart, isInCart, fetchCart } = useCartStore(); // Добавили fetchCart
  const router = useRouter();

  const [filters, setFilters] = useState({
    category: '',
    subcategory: '',
    minPrice: 0,
    maxPrice: 1000,
    inStockOnly: false,
  });

  // Загрузка категорий
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/categories');
        setCategories(response.data.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        alert('Не удалось загрузить категории.');
      }
    };
    fetchCategories();
  }, []);

  // Загрузка товаров
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = {
          category: filters.category || undefined,
          subcategory: filters.subcategory || undefined,
        };
        const response = await axios.get('http://localhost:8000/api/products', { params });
        const fetchedProducts = response.data.data.map((product: Product) => ({
          ...product,
          price: parseFloat(product.price as string),
        }));
        setProducts(fetchedProducts);
        const maxProductPrice = Math.max(...fetchedProducts.map((p: Product) => p.price), 1000);
        setFilters((prev) => ({
          ...prev,
          maxPrice: maxProductPrice,
        }));
      } catch (error) {
        console.error('Error fetching products:', error);
        alert('Не удалось загрузить товары.');
      }
    };
    fetchProducts();
  }, [filters.category, filters.subcategory]);

  // Инициализация корзины на клиенте
  useEffect(() => {
    fetchCart(); // Вызов fetchCart только после монтирования
  }, [fetchCart]);

  const filteredProducts = products.filter((product) => {
    const matchesPrice =
      product.price >= filters.minPrice && product.price <= filters.maxPrice;
    const matchesStock = !filters.inStockOnly || product.stock > 0;
    return matchesPrice && matchesStock;
  });

  const handleAddToCart = async (product: Product) => {
    const added = await addToCart(product);
    if (added) {
      alert(`${product.name} добавлен в корзину!`);
      router.push('/cart');
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    if (name === 'category') {
      setFilters((prev) => ({
        ...prev,
        category: value,
        subcategory: '',
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
      }));
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', display: 'flex', gap: '16px' }}>
      <div style={{ width: '200px', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>
          Фильтры
        </h3>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Категория:
          </label>
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
          >
            <option value="">Все</option>
            {categories.map((category) => (
              <option key={category.id} value={category.key}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        {filters.category && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Подкатегория:
            </label>
            <select
              name="subcategory"
              value={filters.subcategory}
              onChange={handleFilterChange}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
            >
              <option value="">Все</option>
              {categories
                .find((cat) => cat.key === filters.category)
                ?.subcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.name}>
                    {subcategory.name}
                  </option>
                ))}
            </select>
          </div>
        )}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Цена:
          </label>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              От: {filters.minPrice} $
            </label>
            <input
              type="range"
              name="minPrice"
              min="0"
              max={filters.maxPrice}
              value={filters.minPrice}
              onChange={handleFilterChange}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              До: {filters.maxPrice} $
            </label>
            <input
              type="range"
              name="maxPrice"
              min={filters.minPrice}
              max={Math.max(...products.map((p) => p.price), 1000)}
              value={filters.maxPrice}
              onChange={handleFilterChange}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            <input
              type="checkbox"
              name="inStockOnly"
              checked={filters.inStockOnly}
              onChange={handleFilterChange}
              style={{ marginRight: '8px' }}
            />
            Только в наличии
          </label>
        </div>
      </div>

      <div style={{ flexGrow: '1' }}>
        <div
          style={{
            backgroundColor: '#fffacd',
            padding: '24px',
            borderRadius: '8px',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#000000' }}>
                Горячие товары!
              </h2>
              <p style={{ fontSize: '18px', color: '#000000' }}>До 90% скидки</p>
              <button
                style={{
                  marginTop: '16px',
                  backgroundColor: '#000000',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Смотреть >
              </button>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="banner-placeholder">Ноутбук</div>
              <div className="banner-placeholder">Одежда</div>
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '8px',
              backgroundColor: '#ff0000',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#ff0000',
              marginBottom: '16px',
            }}
          >
            Главные скидки
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {filteredProducts.slice(0, 8).map((product) => {
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
                      style={{
                        width: '100%',
                        height: '12rem',
                        objectFit: 'cover',
                        borderRadius: '8px 8px 0 0',
                      }}
                      onError={(e) =>
                        console.error(
                          `Failed to load image for ${product.name}: ${product.image}`
                        )
                      }
                    />
                  ) : (
                    <div
                      style={{
                        height: '12rem',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '8px 8px 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {product.name}
                    </div>
                  )}
                  <div style={{ padding: '16px' }}>
                    <h4
                      style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#333333',
                        marginBottom: '8px',
                      }}
                    >
                      {product.name}
                    </h4>
                    <p
                      style={{
                        fontSize: '14px',
                        color: '#666666',
                        marginBottom: '16px',
                      }}
                    >
                      {product.category.name}
                      {product.subcategory ? ` / ${product.subcategory.name}` : ''}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
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
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = inCart
                          ? '#4A4A4A'
                          : '#e65a00')
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor = inCart
                          ? '#666666'
                          : '#ff6200')
                      }
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
      </div>
    </div>
  );
}