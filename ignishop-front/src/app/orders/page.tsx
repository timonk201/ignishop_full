'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { useAuthStore } from '../../store/authStore';
import { FaMoneyBillWave } from 'react-icons/fa';

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
  used_bonus_points?: number;
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
        used_bonus_points: order.used_bonus_points || 0,
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
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 2px 8px rgba(255,98,0,0.08)',
                padding: 24,
                marginBottom: 12,
                position: 'relative',
                borderLeft: '6px solid #ff6200',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <span style={{ fontSize: 22, color: '#ff6200' }}>🧾</span>
                <span style={{ fontSize: 18, color: '#333', fontWeight: 600 }}>
                Заказ #{order.id} от {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>
              <div style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>
                Способ получения: {order.delivery_method === 'pickup' ? 'Самовывоз' : 'Доставка'}
              </div>
              {order.delivery_method === 'delivery' && order.address && (
                <div style={{
                  background: '#FFF8F3',
                  border: '2px solid #FF6200',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  margin: '10px 0',
                  fontSize: '16px',
                  color: '#333333',
                  fontWeight: 'bold',
                }}>
                  <span style={{fontSize: '20px', color: '#FF6200'}}>📦</span> <span>Адрес доставки:</span>
                  <ul style={{margin: '8px 0 0 32px', padding: 0, listStyle: 'disc'}}>
                    {order.address.split(',').map((part, idx) => (
                      <li key={idx} style={{fontWeight: 'normal', color: '#333', fontSize: '15px'}}>{part.trim()}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div style={{ marginTop: '8px' }}>
                {order.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px' }}>
                    {item.image && (
                      <img
                        src={item.image.startsWith('http') ? item.image : `http://localhost:8000/storage/${item.image}`}
                        alt={item.name}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #ff6200' }}
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
                            background: '#CCCCCC',
                            color: '#666666',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            cursor: 'pointer',
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: 15,
                          }}
                        >
                          Отзыв оставлен
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowReviewModal({ orderId: order.id, productId: item.id })}
                          style={{
                            background: 'linear-gradient(90deg, #ff6200 0%, #ff9d2f 100%)',
                            color: '#fff',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            cursor: 'pointer',
                            marginTop: '8px',
                            fontWeight: 700,
                            fontSize: 15,
                            transition: 'background 0.2s',
                          }}
                        >
                          Оставить отзыв
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                marginTop: 18,
                background: '#fff8f0',
                borderRadius: 12,
                padding: '18px 28px',
                boxShadow: '0 2px 8px rgba(255,98,0,0.06)',
                fontSize: 20,
                fontWeight: 600,
                color: '#333',
              }}>
                <FaMoneyBillWave size={32} color="#ff6200" />
                <span>Сумма заказа: {order.total.toFixed(2)}$</span>
                {order.used_bonus_points && order.used_bonus_points > 0 && (
                  <span style={{ color: '#ff6200', fontWeight: 700, fontSize: 18 }}>
                    -{order.used_bonus_points}$ бонусами
                  </span>
                )}
                <span style={{ color: '#003087', fontWeight: 700, fontSize: 22, marginLeft: 'auto' }}>
                  Фактически оплачено: {(order.total - (order.used_bonus_points || 0)).toFixed(2)}$
                </span>
              </div>
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
          background: 'rgba(0,0,0,0.45)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'linear-gradient(120deg, #fff8f0 0%, #fff 100%)',
            padding: '36px 32px 28px 32px',
            borderRadius: '22px',
            width: '420px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(255,98,0,0.18)',
            border: '2px solid #ff6200',
            position: 'relative',
          }}>
            <h3 style={{ fontSize: '26px', fontWeight: 700, color: '#ff6200', marginBottom: '18px', textAlign: 'center', letterSpacing: 0.5 }}>Оставить отзыв</h3>
            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <label style={{ fontSize: '16px', color: '#333', fontWeight: 500 }}>Оценка:</label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: 6 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setRating(star)}
                    style={{
                      fontSize: '32px',
                      color: star <= rating ? '#ff6200' : '#eee',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                      filter: star <= rating ? 'drop-shadow(0 2px 6px #ff620044)' : 'none',
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <label style={{ fontSize: '16px', color: '#333', fontWeight: 500 }}>Комментарий:</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Напишите ваш отзыв..."
                style={{ padding: '14px', border: '1.5px solid #ff6200', borderRadius: '10px', minHeight: '100px', fontSize: 16, resize: 'vertical', background: '#fff8f0', color: '#333' }}
              />
              <label style={{ fontSize: '16px', color: '#333', fontWeight: 500 }}>Фото (опционально):</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
                style={{ padding: '8px', borderRadius: 8, border: '1.5px solid #ff6200', background: '#fff8f0', color: '#333' }}
              />
              <div style={{ display: 'flex', gap: '12px', marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={rating === 0}
                  style={{
                    background: rating === 0 ? '#ffb98a' : 'linear-gradient(90deg, #ff6200 0%, #ff9d2f 100%)',
                    color: '#fff',
                    padding: '14px',
                    borderRadius: 10,
                    border: 'none',
                    cursor: rating === 0 ? 'not-allowed' : 'pointer',
                    flexGrow: 1,
                    fontWeight: 700,
                    fontSize: 17,
                    boxShadow: '0 2px 8px rgba(255,98,0,0.08)',
                    transition: 'background 0.2s',
                  }}
                >
                  Отправить
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(null)}
                  style={{
                    background: '#666',
                    color: '#fff',
                    padding: '14px',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    flexGrow: 1,
                    fontWeight: 700,
                    fontSize: 17,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'background 0.2s',
                  }}
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