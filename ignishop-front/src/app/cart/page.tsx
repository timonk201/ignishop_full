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
  const { cart, localCart, updateQuantity, removeFromCart, clearCart, fetchCart } = useCartStore();
  const { user, loading: userLoading } = useUser();
  const { openAuthModal } = useAuthStore();
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [apartment, setApartment] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const router = useRouter();

  const DELIVERY_COST = 30;

  const countryOptions = [
    'Россия',
    'Беларусь',
    'Казахстан',
    'Украина',
    'Армения',
    'Грузия',
    'Азербайджан',
    'Узбекистан',
    'Киргизия',
    'Таджикистан',
    'Молдова',
    'Латвия',
    'Литва',
    'Эстония',
  ];

  // Определяем, какую корзину использовать
  const activeCart = user ? cart : localCart;

  useEffect(() => {
    if (userLoading) return; // Ждём завершения загрузки пользователя
    if (!user) {
      openAuthModal();
      router.push('/');
      return;
    }
    fetchCart(user);
  }, [fetchCart, user, userLoading, openAuthModal, router]);

  if (userLoading) {
    return <p style={{ textAlign: 'center', fontSize: '18px', color: '#333333' }}>Загрузка...</p>;
  }

  if (!user) return null;

  const totalPrice = activeCart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const finalPrice = deliveryMethod === 'delivery' ? totalPrice + DELIVERY_COST : totalPrice;

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const item of activeCart) {
      if (item.quantity > item.stock) {
        alert(`Недостаточно товара "${item.name}" на складе. Доступно: ${item.stock}, в корзине: ${item.quantity}.`);
        return;
      }
    }

    const orderData = {
      items: activeCart.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        description: item.description,
        price: Number(item.price),
        stock: item.stock,
        image: item.image,
        quantity: item.quantity,
      })),
      total: finalPrice,
      delivery_method: deliveryMethod,
      address: deliveryMethod === 'delivery'
        ? `${country}, ${city}, ${street}, д. ${house}${apartment ? ', кв. ' + apartment : ''}, ${postalCode}`
        : null,
    };

    try {
      const response = await axios.post('http://localhost:8000/api/orders', orderData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Заказ сохранен на сервере:', response.data);
      await clearCart(user);
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
      {activeCart.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '18px', color: '#333333' }}>Корзина пуста</p>
      ) : (
        <>
          <div style={{ marginBottom: '24px' }}>
            {activeCart.map((item) => (
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
                      src={item.image.startsWith('http') ? item.image : `http://localhost:8000/storage/${item.image}`}
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
                        onChange={(e) => updateQuantity(item.id, Number(e.target.value), user)}
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
                    onClick={() => removeFromCart(item.id, user)}
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
              Общая сумма: <span style={{ color: '#FF6200' }}>{finalPrice.toFixed(2)} $</span>
            </p>
            {deliveryMethod === 'delivery' && (
              <p style={{ color: '#666', fontSize: '16px', marginTop: '8px' }}>Включая доставку: <span style={{ color: '#FF6200' }}>{DELIVERY_COST.toFixed(2)} $</span></p>
            )}
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
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginTop: '8px',
                    background: '#FFF8F3',
                    border: '2px solid #FF6200',
                    borderRadius: '8px',
                    padding: '16px',
                    maxWidth: '100%',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <label style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>Страна</label>
                    <select
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px', minWidth: 0 }}
                      required
                    >
                      <option value="">Выберите страну</option>
                      {countryOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <label style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>Город</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px', minWidth: 0 }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <label style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>Улица</label>
                    <input
                      type="text"
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                      style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px', minWidth: 0 }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <label style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>Дом</label>
                    <input
                      type="text"
                      value={house}
                      onChange={e => setHouse(e.target.value)}
                      style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px', minWidth: 0 }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <label style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>Квартира (необязательно)</label>
                    <input
                      type="text"
                      value={apartment}
                      onChange={e => setApartment(e.target.value)}
                      style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px', minWidth: 0 }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <label style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>Почтовый индекс</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={e => setPostalCode(e.target.value)}
                      style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px', minWidth: 0 }}
                      required
                    />
                  </div>
                  <style>{`
                    @media (max-width: 700px) {
                      .address-grid {
                        grid-template-columns: 1fr !important;
                      }
                    }
                  `}</style>
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