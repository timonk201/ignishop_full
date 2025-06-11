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

interface Review {
  id: number;
  user_id: number;
  product_id: number;
  order_id: number;
  rating: number;
  comment: string | null;
  image: string | null;
  created_at: string;
  user: { name: string };
}

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart, isInCart, updateQuantity, removeFromCart, cart, localCart, fetchCart } = useCartStore();
  const { addToFavorites, removeFromFavorites, isInFavorites, fetchFavorites } = useFavoriteStore();
  const { user, loading: userLoading } = useUser();
  const { openAuthModal } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localQuantity, setLocalQuantity] = useState(1);

  const activeCart = user ? cart : localCart;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [productResponse, reviewsResponse] = await Promise.all([
          axios.get(`http://localhost:8000/api/products/${id}`),
          axios.get(`http://localhost:8000/api/products/${id}/reviews`),
        ]);
        setProduct(productResponse.data.data);
        setReviews(reviewsResponse.data.data.reviews);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setError('Сессия истекла. Пожалуйста, войдите снова.');
          openAuthModal();
        } else {
          setError('Не удалось загрузить информацию о товаре.');
          console.error('Error fetching product or reviews:', err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, openAuthModal]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchCart(user);
      fetchFavorites();
    }
  }, [user, userLoading, fetchCart, fetchFavorites]);

  useEffect(() => {
    const cartItem = activeCart.find((item) => item.id === Number(id));
    if (cartItem) {
      setLocalQuantity(cartItem.quantity);
    } else {
      setLocalQuantity(1);
    }
  }, [activeCart, id]);

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
        await addToCart({ ...product, quantity: localQuantity }, user);
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
    const cartItem = activeCart.find((item) => item.id === product.id);
    if (cartItem) {
      try {
        await updateQuantity(product.id, newQuantity, user);
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
    await removeFromCart(product.id, user);
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
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const totalReviews = reviews.length;
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: totalReviews > 0 ? (reviews.filter(r => r.rating === rating).length / totalReviews) * 100 : 0,
  }));

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333333' }}>{product.name}</h1>
            {totalReviews > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div>
                  {Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <span
                        key={index}
                        style={{
                          fontSize: '20px',
                          color: index < Math.round(averageRating) ? '#FF6200' : '#ccc',
                        }}
                      >
                        ★
                      </span>
                    ))}
                </div>
                <span style={{ fontSize: '16px', color: '#666666' }}>{totalReviews}</span>
              </div>
            )}
          </div>
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

            {user && (
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
            )}
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

      {reviews.length > 0 && (
        <div style={{ marginTop: '24px', backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>Отзывы</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#333333' }}>{averageRating.toFixed(1)}</span>
              <div>
                {Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <span
                      key={index}
                      style={{
                        fontSize: '20px',
                        color: index < Math.round(averageRating) ? '#FF6200' : '#ccc',
                      }}
                    >
                      ★
                    </span>
                  ))}
              </div>
              <span style={{ fontSize: '14px', color: '#666666' }}>Все {totalReviews} отзывов</span>
            </div>
            <div style={{ flex: 1 }}>
              {ratingDistribution.map(({ rating, count, percentage }) => (
                count > 0 && (
                  <div key={rating} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', color: '#333333', width: '30px' }}>{rating} ★</span>
                    <div style={{ flex: 1, margin: '0 8px' }}>
                      <div
                        style={{
                          height: '8px',
                          backgroundColor: '#e0e0e0',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: '100%',
                            backgroundColor: '#FF6200',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    </div>
                    <span style={{ fontSize: '14px', color: '#666666', width: '40px', textAlign: 'right' }}>{count}</span>
                  </div>
                )
              ))}
            </div>
          </div>
          {reviews.map((review) => (
            <div key={review.id} style={{ marginTop: '16px', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#333333' }}>{review.user.name}</p>
              <p style={{ fontSize: '14px', color: '#666666' }}>Оценка: {review.rating} / 5</p>
              {review.comment && <p style={{ fontSize: '14px', color: '#333333' }}>{review.comment}</p>}
              {review.image && (
                <img
                  src={`http://localhost:8000${review.image}`}
                  alt="Review image"
                  style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', marginTop: '8px' }}
                  onError={(e) => {
                    console.error(`Failed to load review image: ${review.image}`);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <p style={{ fontSize: '12px', color: '#666666' }}>{new Date(review.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}