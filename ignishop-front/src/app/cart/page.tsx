'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/cartStore';
import { useUser } from '../context/UserContext';
import { useAuthStore } from '../../store/authStore';
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
  items: Product[];
  total: number;
  deliveryMethod: string;
  address?: string;
  createdAt: string;
}

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, fetchCart } = useCartStore();
  const { user } = useUser();
  const { openAuthModal } = useAuthStore();
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [address, setAddress] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      openAuthModal();
      router.push('/');
      return;
    }
    fetchCart();
  }, [fetchCart, user, openAuthModal, router]);

  if (!user) return null;

  const totalPrice = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const item of cart) {
      if (item.quantity > item.stock) {
        alert(`Недостаточно товара "${item.name}" на складе. Доступно: ${item.stock}, в корзине: ${item.quantity}.`);
        return;
      }
    }

    const orderData = {
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        description: item.description,
        price: Number(item.price),
        stock: item.stock,
        image: item.image,
        quantity: item.quantity,
      })),
      total: totalPrice,
      delivery_method: deliveryMethod,
      address: deliveryMethod === 'delivery' ? address : null,
    };

    try {
      const response = await axios.post('http://localhost:8000/api/orders', orderData);
      console.log('Заказ сохранен на сервере:', response.data);
      await clearCart();
      alert('Заказ успешно оформлен!');
      router.push('/orders');
    } catch (error: any) {
      console.error('Ошибка при сохранении заказа:', error);
      const errorMessage = error.response?.data?.message || 'Произошла ошибка при оформлении заказа. Попробуйте снова.';
      alert(errorMessage);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333333', marginBottom: '24px' }}>Корзина</h2>
      {cart.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '18px', color: '#333333' }}>Корзина пуста</p>
      ) : (
        <>
          <div style={{ marginBottom: '24px' }}>
            {cart.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  padding: '16px',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'transform 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {item.image && (
                    <img
                      src={`http://localhost:8000${item.image}`}
                      alt={item.name}
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                      onError={(e) => {
                        console.error(`Failed to load image for ${item.name}: ${item.image}`);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333333', marginBottom: '8px' }}>{item.name}</h3>
                    <p style={{ fontSize: '16px', color: '#FF6200', fontWeight: 'bold', marginBottom: '8px' }}>{Number(item.price).toFixed(2)} $</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '14px', color: '#666666' }}>Количество:</label>
                      <input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                        style={{
                          width: '80px',
                          padding: '8px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          outline: 'none',
                          color: '#333333',
                          fontSize: '14px',
                        }}
                      />
                      {item.quantity > item.stock && (
                        <p style={{ color: '#FF0000', fontSize: '12px' }}>
                          Внимание: На складе осталось {item.stock} единиц!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#333333' }}>Итого: {(Number(item.price) * item.quantity).toFixed(2)} $</p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    style={{
                      backgroundColor: '#666666',
                      color: '#FFFFFF',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4A4A4A')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#666666')}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#333333' }}>
              Общая сумма: <span style={{ color: '#FF6200' }}>{totalPrice.toFixed(2)} $</span>
            </p>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', maxWidth: '400px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>Оформление заказа</h3>
            <form onSubmit={handleOrderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>Способ получения:</label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    outline: 'none',
                    color: '#333333',
                    fontSize: '14px',
                  }}
                >
                  <option value="pickup">Самовывоз</option>
                  <option value="delivery">Доставка</option>
                </select>
              </div>
              {deliveryMethod === 'delivery' && (
                <div>
                  <label style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>Адрес доставки:</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Введите адрес доставки"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      outline: 'none',
                      color: '#333333',
                      fontSize: '14px',
                      resize: 'vertical',
                    }}
                    required
                  />
                </div>
              )}
              <button
                type="submit"
                style={{
                  backgroundColor: '#FF6200',
                  color: '#FFFFFF',
                  padding: '12px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'semibold',
                  transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e65a00')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF6200')}
              >
                Оформить заказ
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}