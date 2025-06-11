'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { useAuthStore } from '../../store/authStore';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  id: number;
  items: Product[];
  total: number;
  delivery_method: string;
  address?: string;
  created_at: string;
  reviewed_items?: number[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { user, loading: userLoading } = useUser();
  const { openAuthModal } = useAuthStore();
  const router = useRouter();
  const [showReviewModal, setShowReviewModal] = useState<{ orderId: number; productId: number } | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [image, setImage] = useState<File | null>(null);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/orders', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const fetchedOrders = response.data.data.map((order: any) => ({
        ...order,
        total: parseFloat(String(order.total)),
        created_at: order.created_at,
        reviewed_items: order.reviewed_items || [],
      }));
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Ошибка при загрузке заказов:', error);
      alert('Не удалось загрузить историю заказов.');
      setOrders([]);
    }
  };

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      openAuthModal();
      router.push('/');
      return;
    }

    fetchOrders();
  }, [user, userLoading, openAuthModal, router]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReviewModal || !user) return;

    const formData = new FormData();
    formData.append('rating', rating.toString());
    formData.append('comment', comment);
    if (image) formData.append('image', image);

    try {
      await axios.post(
        `http://localhost:8000/api/orders/${showReviewModal.orderId}/products/${showReviewModal.productId}/reviews`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      alert('Отзыв успешно добавлен!');
      // Перезагрузка данных заказов с сервера
      await fetchOrders();
      setShowReviewModal(null);
      setRating(0);
      setComment('');
      setImage(null);
    } catch (error) {
      console.error('Ошибка при добавлении отзыва:', error);
      alert('Не удалось добавить отзыв.');
    }
  };

  if (userLoading) {
    return <p style={{ textAlign: 'center', fontSize: '18px', color: '#333333' }}>Загрузка...</p>;
  }

  if (!user) return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333333', marginBottom: '24px' }}>История заказов</h2>
      {orders.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '18px', color: '#333333' }}>У вас пока нет заказов.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                padding: '16px',
              }}
            >
              <p style={{ fontSize: '16px', color: '#666666' }}>
                Заказ #{order.id} от {new Date(order.created_at).toLocaleDateString()}
              </p>
              <p style={{ fontSize: '16px', color: '#333333' }}>
                Способ получения: {order.delivery_method === 'pickup' ? 'Самовывоз' : 'Доставка'}
              </p>
              {order.address && <p style={{ fontSize: '16px', color: '#333333' }}>Адрес: {order.address}</p>}
              <div style={{ marginTop: '8px' }}>
                {order.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px' }}>
                    {item.image && (
                      <img
                        src={`http://localhost:8000${item.image}`}
                        alt={item.name}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                        onError={(e) => {
                          console.error(`Failed to load image for ${item.name}: ${item.image}`);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <p style={{ fontSize: '16px', color: '#333333' }}>{item.name}</p>
                      <p style={{ fontSize: '14px', color: '#666666' }}>
                        {item.quantity} x {item.price.toFixed(2)} $ = {(item.quantity * item.price).toFixed(2)} $
                      </p>
                      {order.reviewed_items?.includes(item.id) ? (
                        <button
                          onClick={() => router.push('/profile')}
                          disabled={false}
                          style={{
                            backgroundColor: '#CCCCCC',
                            color: '#666666',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            cursor: 'pointer',
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                        >
                          Отзыв оставлен
                          <span style={{ fontSize: '12px' }}>посмотреть</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowReviewModal({ orderId: order.id, productId: item.id })}
                          style={{
                            backgroundColor: '#FF6200',
                            color: '#FFFFFF',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            cursor: 'pointer',
                            marginTop: '8px',
                            transition: 'background-color 0.3s',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e65a00')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF6200')}
                        >
                          Оставить отзыв
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#FF6200', marginTop: '8px' }}>
                Итого: {order.total.toFixed(2)} $
              </p>
            </div>
          ))}
        </div>
      )}

      {showReviewModal && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>Оставить отзыв</h3>
            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ fontSize: '14px', color: '#666666' }}>Оценка (1-5):</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setRating(star)}
                    style={{
                      fontSize: '24px',
                      color: star <= rating ? '#FF6200' : '#ccc',
                      cursor: 'pointer',
                      transition: 'color 0.3s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.color = star <= rating ? '#e65a00' : '#ccc')}
                    onMouseOut={(e) => (e.currentTarget.style.color = star <= rating ? '#FF6200' : '#ccc')}
                  >
                    ★
                  </span>
                ))}
              </div>
              <label style={{ fontSize: '14px', color: '#666666' }}>Комментарий:</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Напишите ваш отзыв..."
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '100px' }}
              />
              <label style={{ fontSize: '14px', color: '#666666' }}>Фото (опционально):</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
                style={{ padding: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  disabled={rating === 0}
                  style={{
                    backgroundColor: '#FF6200',
                    color: '#FFFFFF',
                    padding: '12px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: rating === 0 ? 'not-allowed' : 'pointer',
                    flexGrow: 1,
                    transition: 'background-color 0.3s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = rating === 0 ? '#FF6200' : '#e65a00')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF6200')}
                >
                  Отправить
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(null)}
                  style={{
                    backgroundColor: '#666666',
                    color: '#FFFFFF',
                    padding: '12px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    flexGrow: 1,
                    transition: 'background-color 0.3s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4A4A4A')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#666666')}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}