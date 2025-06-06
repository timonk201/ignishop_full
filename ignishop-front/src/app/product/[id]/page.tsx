'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useCartStore } from '../../../store/cartStore';
import { useFavoriteStore } from '../../../store/favoriteStore';
import { useUser } from '../../context/UserContext';
import { useAuthStore } from '../../../store/authStore';
import { FaTrash, FaHeart, FaHeartBroken } from 'react-icons/fa';

interface Category {
  key: string;
  name: string;
}

interface Subcategory {
  name: string;
}

export interface Product {
  id: number;
  name: string;
  category: Category;
  subcategory: Subcategory | null;
  description: string;
  price: number | string;
  stock: number;
  image?: string;
  created_at: string;
  updated_at: string;
  is_favorited?: boolean;
}

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart, isInCart, updateQuantity, removeFromCart, cart, fetchCart } = useCartStore();
  const { addToFavorites, removeFromFavorites, isInFavorites, fetchFavorites } = useFavoriteStore();
  const { user, loading: userLoading } = useUser();
  const { openAuthModal } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localQuantity, setLocalQuantity] = useState(1);

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

  useEffect(() => {
    if (!userLoading && user) {
      fetchCart(); // Загружаем корзину
      fetchFavorites(); // Загружаем избранное
    }
  }, [user, userLoading, fetchCart, fetchFavorites]);

  useEffect(() => {
    const cartItem = cart.find((item) => item.id === Number(id));
    if (cartItem) {
      setLocalQuantity(cartItem.quantity);
    } else {
      setLocalQuantity(1);
    }
  }, [cart, id]);

  const handleBuyNow = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (product) {
      if (product.stock < 1) {
        alert('Товара нет в наличии.');
        return;
      }
      try {
        await addToCart({ ...product, quantity: localQuantity });
      } catch (error) {
        alert('Ошибка при добавлении в корзину. Попробуйте снова.');
      }
    }
  };

  const handleQuantityChange = async (change: number) => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (!product) return;
    const newQuantity = Math.max(1, Math.min(localQuantity + change, product.stock));
    setLocalQuantity(newQuantity);
    const cartItem = cart.find((item) => item.id === product.id);
    if (cartItem) {
      try {
        await updateQuantity(product.id, newQuantity);
      } catch (error) {
        alert('Ошибка при обновлении количества. Попробуйте снова.');
        setLocalQuantity(cartItem.quantity);
      }
    }
  };

  const handleRemoveFromCart = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (!product) return;
    await removeFromCart(product.id);
    setLocalQuantity(1);
  };

  const handleGoToCart = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    router.push('/cart');
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (!product) return;

    if (isInFavorites(product.id)) {
      await removeFromFavorites(product.id);
    } else {
      await addToFavorites(product.id);
    }
  };

  if (userLoading || loading) return <p style={{ textAlign: 'center', fontSize: '18px', color: '#333333' }}>Загрузка...</p>;
  if (error) return <p style={{ textAlign: 'center', fontSize: '18px', color: '#FF0000' }}>{error}</p>;
  if (!product) return <p style={{ textAlign: 'center', fontSize: '18px', color: '#333333' }}>Товар не найден.</p>;

  const inCart = isInCart(product.id);
  const inFavorites = isInFavorites(product.id);

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

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>{product.name}</h1>
          <p style={{ fontSize: '16px', color: '#666666', marginBottom: '16px' }}>
            Категория: {product.category.name}
            {product.subcategory && ` / ${product.subcategory.name}`}
          </p>
          <p style={{ fontSize: '18px', color: '#333333', marginBottom: '16px' }}>{product.description}</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF6200', marginBottom: '16px' }}>
            Цена: {parseFloat(product.price as string).toFixed(2)} $
          </p>
          <p style={{ fontSize: '16px', color: '#333333', marginBottom: '16px' }}>
            На складе: {product.stock} единиц
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <button
              onClick={inCart ? handleGoToCart : handleBuyNow}
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
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = inCart ? '#4A4A4A' : '#e65a00')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = inCart ? '#666666' : '#FF6200')}
            >
              {inCart ? 'В корзине' : 'Купить'}
            </button>

            {inCart && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {localQuantity === 1 ? (
                  <button
                    onClick={handleRemoveFromCart}
                    style={{
                      backgroundColor: '#FF0000',
                      color: '#FFFFFF',
                      padding: '8px',
                      borderRadius: '50%',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      transition: 'background-color 0.3s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#CC0000')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF0000')}
                  >
                    <FaTrash size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    style={{
                      backgroundColor: '#666666',
                      color: '#FFFFFF',
                      padding: '8px',
                      borderRadius: '50%',
                      border: 'none',
                      cursor: 'pointer',
                      width: '32px',
                      height: '32px',
                      transition: 'background-color 0.3s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4A4A4A')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#666666')}
                  >
                    −
                  </button>
                )}
                <span style={{ fontSize: '16px', color: '#333333', minWidth: '24px', textAlign: 'center' }}>{localQuantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  style={{
                    backgroundColor: '#FF6200',
                    color: '#FFFFFF',
                    padding: '8px',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    width: '32px',
                    height: '32px',
                    transition: 'background-color 0.3s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e65a00')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF6200')}
                >
                  +
                </button>
              </div>
            )}

            <button
              onClick={handleToggleFavorite}
              style={{
                backgroundColor: inFavorites ? '#FF0000' : '#FFFFFF',
                color: inFavorites ? '#FFFFFF' : '#FF0000',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '2px solid #FF0000',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'semibold',
                transition: 'background-color 0.3s, color 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseOver={(e) => {
                if (inFavorites) {
                  e.currentTarget.style.backgroundColor = '#CC0000';
                } else {
                  e.currentTarget.style.backgroundColor = '#FFF5F5';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = inFavorites ? '#FF0000' : '#FFFFFF';
              }}
            >
              {inFavorites ? <FaHeartBroken size={16} /> : <FaHeart size={16} />}
              {inFavorites ? 'Убрать из избранного' : 'В избранное'}
            </button>
          </div>
          {inCart && (
            <p
              style={{
                fontSize: '14px',
                color: '#666666',
                cursor: 'pointer',
                textDecoration: 'underline',
                marginTop: '-8px',
                marginLeft: '8px',
              }}
              onClick={handleGoToCart}
              onMouseOver={(e) => (e.currentTarget.style.color = '#FF6200')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#666666')}
            >
              Перейти
            </p>
          )}
        </div>
      </div>
    </div>
  );
}