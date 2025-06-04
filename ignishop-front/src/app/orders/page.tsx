'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

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
  quantity: number;
}

export interface Order {
  id: number;
  user_id?: number;
  items: Product[];
  total: number | string;
  delivery_method: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/orders');
        console.log('API response for orders:', response.data); // Логируем ответ для отладки
        const fetchedOrders = response.data.data.map((order: any) => {
          const total = parseFloat(String(order.total));
          const items = order.items.map((item: Product) => {
            const price = parseFloat(String(item.price));
            console.log(`Item ${item.id} raw price: ${item.price}, parsed price: ${price}`); // Логируем price
            return {
              ...item,
              price: isNaN(price) ? (typeof item.price === 'number' ? item.price : 0) : price,
            };
          });
          return {
            ...order,
            items,
            total: isNaN(total) ? 0 : total,
          };
        });
        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Ошибка при загрузке заказов:', error);
        alert('Не удалось загрузить историю заказов.');
      }
    };
    fetchOrders();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333333', marginBottom: '24px' }}>История заказов</h2>
      {orders.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '18px', color: '#333333' }}>Заказов пока нет.</p>
      ) : (
        <div style={{ marginBottom: '24px' }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                padding: '16px',
                marginBottom: '16px',
                transition: 'transform 0.3s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333333', marginBottom: '8px' }}>
                Заказ #{order.id} - {new Date(order.created_at).toLocaleDateString()}
              </h3>
              <p style={{ fontSize: '16px', color: '#666666', marginBottom: '16px' }}>
                Способ доставки: {order.delivery_method === 'pickup' ? 'Самовывоз' : 'Доставка'}
                {order.address && `, Адрес: ${order.address}`}
              </p>
              <div style={{ marginBottom: '16px' }}>
                {order.items.map((item) => {
                  const itemPrice = parseFloat(String(item.price));
                  const totalItemPrice = isNaN(itemPrice) ? 0 : itemPrice * item.quantity;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {item.image && (
                          <img
                            src={`http://localhost:8000${item.image}`}
                            alt={item.name}
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                            onError={(e) => {
                              console.error(`Failed to load image for ${item.name}: ${item.image}`);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span style={{ fontSize: '16px', color: '#333333' }}>
                          {item.name} x{item.quantity}
                        </span>
                      </div>
                      <span style={{ fontSize: '16px', color: '#FF6200', fontWeight: 'bold' }}>
                        {totalItemPrice.toFixed(2)} $
                      </span>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#333333' }}>
                Общая сумма: <span style={{ color: '#FF6200' }}>{isNaN(order.total as number) ? '0.00' : (order.total as number).toFixed(2)} $</span>
              </p>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => router.push('/')}
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
        Вернуться на главную
      </button>
    </div>
  );
}