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
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { user, loading: userLoading } = useUser();
  const { openAuthModal } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (userLoading) return; // Ждём завершения загрузки пользователя
    if (!user) {
      openAuthModal();
      router.push('/');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/orders', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('API response for orders:', response.data);
        const fetchedOrders = response.data.data.map((order: any) => ({
          ...order,
          total: parseFloat(String(order.total)),
          created_at: order.created_at,
        }));
        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Ошибка при загрузке заказов:', error);
        alert('Не удалось загрузить историю заказов.');
        setOrders([]);
      }
    };

    fetchOrders();
  }, [user, userLoading, openAuthModal, router]);

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
    </div>
  );
}