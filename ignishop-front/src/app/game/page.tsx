'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
}

interface Task {
  product: Product;
  quantity: number;
  completed: boolean;
}

const MAX_TASKS = 5;
const MAX_QUANTITY = 5;
const MIN_QUANTITY = 1;
const MAX_TASK_TOTAL = 1000;

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getTasksKey = (userId?: number | null) => userId ? `userTasks_${userId}` : 'userTasks_guest';

const GamePage = () => {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [bonus, setBonus] = useState(0);
  const { user, loading: userLoading } = useUser();
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const router = useRouter();

  // Открывать модалку если не авторизован
  useEffect(() => {
    if (!userLoading && !user) {
      openAuthModal();
      setTasks(null);
      setLoading(false);
    }
  }, [user, userLoading, openAuthModal]);

  // Получение и сохранение заданий только для авторизованных
  useEffect(() => {
    if (userLoading) return;
    const key = getTasksKey(user?.id);
    if (!user) {
      // Гость: localStorage
      const saved = localStorage.getItem('userTasks_guest');
      if (saved) {
        setTasks(JSON.parse(saved));
        setLoading(false);
      } else {
        // Генерируем guest задания (как раньше)
        const fetchTasks = async () => {
          setLoading(true);
          try {
            const res = await axios.get('http://localhost:8000/api/products', { params: { per_page: 50 } });
            const products: Product[] = res.data.data;
            const shuffled = products.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, MAX_TASKS);
            const tasks: Task[] = selected.map((product) => {
              let maxQty = Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.floor(MAX_TASK_TOTAL / product.price)));
              maxQty = Math.max(MIN_QUANTITY, Math.min(maxQty, MAX_QUANTITY));
              const quantity = getRandomInt(MIN_QUANTITY, maxQty);
              return { product, quantity, completed: false };
            });
            setTasks(tasks);
            localStorage.setItem('userTasks_guest', JSON.stringify(tasks));
          } catch (e) {
            setTasks([]);
          } finally {
            setLoading(false);
          }
        };
        fetchTasks();
      }
      setBonus(0);
      return;
    }
    // Авторизованный пользователь: только backend
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    axios.get('http://localhost:8000/api/user-tasks', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (!res.data || res.data.length === 0) {
        // Нет заданий — генерируем
        axios.post('http://localhost:8000/api/user-tasks/generate', {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(() => {
          // После генерации — снова получаем
          axios.get('http://localhost:8000/api/user-tasks', {
            headers: { Authorization: `Bearer ${token}` }
          }).then(res2 => {
            setTasks(res2.data);
            localStorage.setItem(key, JSON.stringify(res2.data));
            setLoading(false);
          });
        }).catch(err => {
          // Если ошибка 400 — просто повторно получаем задания
          if (err.response && err.response.status === 400) {
            axios.get('http://localhost:8000/api/user-tasks', {
              headers: { Authorization: `Bearer ${token}` }
            }).then(res2 => {
              setTasks(res2.data);
              localStorage.setItem(key, JSON.stringify(res2.data));
              setLoading(false);
            });
          } else {
            setLoading(false);
          }
        });
      } else {
        setTasks(res.data);
        localStorage.setItem(key, JSON.stringify(res.data));
        setLoading(false);
      }
    });
    // Получаем бонусы
    axios.get('http://localhost:8000/api/user/bonus', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setBonus(res.data.bonus_points))
      .catch(() => setBonus(0));
  }, [user, userLoading]);

  // Переход на страницу товара
  const handleGoToProduct = (productId: number) => {
    router.push(`/product/${productId}`);
  };

  if (userLoading || loading || !user || !tasks) {
    return <div style={{ textAlign: 'center', color: '#888', fontSize: 24, marginTop: 80 }}>Загрузка заданий...</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
      <h1 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, color: '#ff6200', marginBottom: 8 }}>
        Ежемесячные задания для покупателей
      </h1>
      <div style={{ textAlign: 'center', marginBottom: 24, fontSize: 18 }}>
        Ваши бонусные баллы: <span style={{ color: '#ff6200', fontWeight: 700 }}>{bonus}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {tasks.map((task, idx) => {
          const total = task.product.price * task.quantity;
          // Для авторизованных reward приходит с backend, для гостей считаем 20%
          const reward = user ? (task as any).reward ?? Math.round(total * 0.2) : Math.round(total * 0.2);
          return (
            <div
              key={task.product.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 2px 8px rgba(255,98,0,0.08)',
                padding: 24,
                gap: 24,
                opacity: task.completed ? 0.5 : 1,
                position: 'relative',
              }}
            >
              {task.product.image && (
                <img
                  src={task.product.image}
                  alt={task.product.name}
                  style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 12, border: '2px solid #ff6200' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#333' }}>{task.product.name}</div>
                <div style={{ color: '#888', margin: '8px 0' }}>
                  Необходимо купить: <b>{task.quantity}</b> шт. (по {task.product.price}$)
                </div>
                <div style={{ color: '#888', margin: '8px 0' }}>
                  Общая сумма: <b>{total.toFixed(2)}$</b>
                </div>
                <div style={{ color: '#ff6200', fontWeight: 600 }}>
                  Награда: +{reward} бонусных баллов <span style={{ fontSize: 13, color: '#888', fontWeight: 400 }}>(20%)</span>
                </div>
              </div>
              <button
                disabled={task.completed}
                onClick={() => handleGoToProduct(task.product.id)}
                style={{
                  background: task.completed ? '#ccc' : 'linear-gradient(90deg, #ff6200 0%, #ff9d2f 100%)',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: 18,
                  padding: '12px 32px',
                  border: 'none',
                  borderRadius: 24,
                  cursor: task.completed ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(255,98,0,0.10)',
                  transition: 'background 0.3s',
                }}
              >
                {task.completed ? 'Выполнено' : 'Перейти к товару'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GamePage; 