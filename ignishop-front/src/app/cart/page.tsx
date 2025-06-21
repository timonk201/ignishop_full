'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/cartStore';
import { useUser } from '../context/UserContext';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';
import { FaGift, FaShoppingCart, FaMoneyBillWave } from 'react-icons/fa';

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
  const [usedBonus, setUsedBonus] = useState(0);
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

  const maxBonus = Math.min(
    Math.floor(finalPrice * 0.9),
    user?.bonus_points ?? 0
  );
  const payWithBonus = maxBonus > 0;
  const toPay = finalPrice - usedBonus;

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
      used_bonus_points: usedBonus,
    };

    try {
      const response = await axios.post('http://localhost:8000/api/orders', orderData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Заказ сохранен на сервере:', response.data);
      await clearCart(user);
      alert('Заказ успешно оформлен!');
      if (user) {
        await axios.get('http://localhost:8000/api/user', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }).then(res => {
          if (res.data && typeof res.data.bonus_points === 'number') {
            user.bonus_points = res.data.bonus_points;
          }
        });
      }
      router.push('/orders');
    } catch (error: any) {
      console.error('Ошибка при сохранении заказа:', error);
      const errorMessage = error.response?.data?.message || 'Произошла ошибка при оформлении заказа. Попробуйте снова.';
      alert(errorMessage);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff6200', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <FaShoppingCart size={36} style={{ color: '#ff6200' }} /> Корзина
      </h2>
      {payWithBonus && (
        <div style={{
          background: '#fff8f0',
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(255,98,0,0.08)',
          padding: '20px 32px',
          margin: '0 auto 24px auto',
          maxWidth: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}>
          <FaGift size={32} color="#ff6200" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, color: '#ff6200', fontWeight: 600, marginBottom: 4 }}>
              Ваши бонусы: {user?.bonus_points}
            </div>
            <div style={{ color: '#888', fontSize: 15, marginBottom: 8 }}>
              Можно оплатить до <b>{maxBonus}</b> бонусов (макс. 90% суммы заказа)
            </div>
            <input
              type="range"
              min={0}
              max={maxBonus}
              value={usedBonus}
              onChange={e => setUsedBonus(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ color: '#333', fontSize: 16, marginTop: 4 }}>
              Использовать бонусов: <b>{usedBonus}</b>
            </div>
          </div>
        </div>
      )}
      {activeCart.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '18px', color: '#333333' }}>Корзина пуста</p>
      ) : (
        <>
          <div style={{ marginBottom: '24px' }}>
            {activeCart.map((item) => (
              <div
                key={item.id}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  boxShadow: '0 2px 8px rgba(255,98,0,0.08)',
                  padding: '16px',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'transform 0.3s',
                  borderLeft: '6px solid #ff6200',
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {item.image && (
                    <img
                      src={item.image.startsWith('http') ? item.image : `http://localhost:8000${item.image.startsWith('/') ? '' : '/storage/'}${item.image}`}
                      alt={item.name}
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #ff6200' }}
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
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 16,
                      transition: 'background 0.2s',
                    }}
                  >
                    Удалить
                  </button>
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
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            <FaMoneyBillWave size={32} color="#ff6200" />
            <span>Сумма заказа: {finalPrice.toFixed(2)}$</span>
            {payWithBonus && usedBonus > 0 && (
              <span style={{ color: '#ff6200', fontWeight: 700, fontSize: 18 }}>
                -{usedBonus}$ бонусами
              </span>
            )}
            <span style={{ color: '#003087', fontWeight: 700, fontSize: 22, marginLeft: 'auto' }}>
              К оплате: {toPay.toFixed(2)}$
            </span>
          </div>
        </>
      )}

      {activeCart.length > 0 && (
        <form
          onSubmit={handleOrderSubmit}
          style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 2px 8px rgba(255,98,0,0.08)',
            padding: '24px',
            marginTop: '24px',
          }}
        >
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6200', marginBottom: '16px' }}>
            Оформление заказа
          </h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '16px', color: '#333333' }}>Способ получения:</label>
            <select
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px',
                outline: 'none',
                color: '#333333',
              }}
            >
              <option value="pickup">Самовывоз</option>
              <option value="delivery">Доставка</option>
            </select>
          </div>

          {deliveryMethod === 'delivery' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Страна"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
                list="country-options"
              />
              <datalist id="country-options">
                {countryOptions.map(c => <option key={c} value={c} />)}
              </datalist>

              <input type="text" placeholder="Город" value={city} onChange={(e) => setCity(e.target.value)} required style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
              <input type="text" placeholder="Улица" value={street} onChange={(e) => setStreet(e.target.value)} required style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
              <input type="text" placeholder="Дом" value={house} onChange={(e) => setHouse(e.target.value)} required style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
              <input type="text" placeholder="Квартира" value={apartment} onChange={(e) => setApartment(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
              <input type="text" placeholder="Почтовый индекс" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#ff6200',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e65a00')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ff6200')}
          >
            <FaMoneyBillWave style={{ marginRight: 8 }} />
            Оформить заказ
          </button>
        </form>
      )}
    </div>
  );
}