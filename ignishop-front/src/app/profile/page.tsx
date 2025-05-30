'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useUser } from '../context/UserContext';

interface User {
  id?: number;
  name: string;
  email: string;
  avatar?: string;
  is_admin?: boolean;
}

export default function ProfilePage() {
  const { refreshUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editAvatarMode, setEditAvatarMode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    avatar: null as File | null,
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(Date.now());
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        setFormData((prev) => ({
          ...prev,
          name: response.data.name,
          email: response.data.email,
          password: '',
        }));
        if (response.data.avatar) {
          setAvatarPreview(`${response.data.avatar}?t=${cacheBuster}`);
        }
      } catch (err) {
        if (err.response) {
          const errorMessage = err.response.data.message || 'Произошла ошибка при загрузке профиля.';
          setError(errorMessage);
        } else if (err.request) {
          setError('Не удалось подключиться к серверу. Проверьте, запущен ли сервер.');
        } else {
          setError('Произошла неизвестная ошибка. Проверьте консоль для деталей.');
        }
        console.error('Ошибка загрузки профиля:', err);
      }
    };

    fetchUser();
  }, [router, cacheBuster]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, avatar: file }));
      setAvatarPreview(URL.createObjectURL(file));
      setEditAvatarMode(true);
      setIsAvatarUploading(true);
      handleAvatarSubmit(file);
    }
  };

  const handleAvatarSubmit = async (avatarFile: File) => {
    const token = localStorage.getItem('token');
    const formDataToSend = new FormData();
    formDataToSend.append('avatar', avatarFile);

    try {
      const response = await axios.post('http://localhost:8000/api/user/update', formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setUser(response.data);
      setEditAvatarMode(false);
      setIsAvatarUploading(false);
      setError('');
      const newCacheBuster = Date.now();
      setCacheBuster(newCacheBuster);
      if (response.data.avatar) {
        setAvatarPreview(`${response.data.avatar}?t=${newCacheBuster}`);
      } else {
        setAvatarPreview(null);
      }
      refreshUser();
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || 'Ошибка при обновлении аватара.');
      } else {
        setError('Не удалось подключиться к серверу.');
      }
      console.error('Ошибка обновления аватара:', err);
      setEditAvatarMode(false);
      setIsAvatarUploading(false);
      setAvatarPreview(user?.avatar ? `${user.avatar}?t=${cacheBuster}` : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('email', formData.email);
    if (formData.password) formDataToSend.append('password', formData.password);
    if (formData.avatar) formDataToSend.append('avatar', formData.avatar);

    try {
      const response = await axios.post('http://localhost:8000/api/user/update', formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setUser(response.data);
      setEditMode(false);
      setError('');
      const newCacheBuster = Date.now();
      setCacheBuster(newCacheBuster);
      if (response.data.avatar) {
        setAvatarPreview(`${response.data.avatar}?t=${newCacheBuster}`);
      } else {
        setAvatarPreview(null);
      }
      setFormData((prev) => ({
        ...prev,
        avatar: null,
      }));
      refreshUser();
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || 'Ошибка при обновлении профиля.');
      } else {
        setError('Не удалось подключиться к серверу.');
      }
      console.error('Ошибка обновления профиля:', err);
    }
  };

  const handleLogout = () => {
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .post(
          'http://localhost:8000/api/logout',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(() => {
          setShowLogoutConfirm(false);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          refreshUser();
          setUser(null);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
          }
          router.push('/');
        })
        .catch((err) => {
          console.error('Ошибка при выходе:', err);
          setShowLogoutConfirm(false);
        });
    }
  };

  const handleImageError = () => {
    setAvatarPreview(null);
    setIsAvatarUploading(false);
  };

  if (!user && !error) {
    return <div style={{ textAlign: 'center', fontSize: '18px', color: '#333333', padding: '40px' }}>Загрузка...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', fontSize: '18px', color: '#FF0000', padding: '40px' }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px', backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', minHeight: '600px' }}>
      <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#003087', marginBottom: '32px', textAlign: 'center' }}>Профиль</h2>
      <div style={{ padding: '32px', backgroundColor: '#F9F9F9', borderRadius: '8px' }}>
        {editMode ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ fontSize: '18px', color: '#333333', marginBottom: '8px', display: 'block' }}>Имя:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ff6200',
                  borderRadius: '20px',
                  fontSize: '16px',
                  color: '#333333',
                  transition: 'border-color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = '#e65a00')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = '#ff6200')}
              />
            </div>
            <div>
              <label style={{ fontSize: '18px', color: '#333333', marginBottom: '8px', display: 'block' }}>Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ff6200',
                  borderRadius: '20px',
                  fontSize: '16px',
                  color: '#333333',
                  transition: 'border-color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = '#e65a00')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = '#ff6200')}
              />
            </div>
            <div>
              <label style={{ fontSize: '18px', color: '#333333', marginBottom: '8px', display: 'block' }}>Новый пароль (оставьте пустым, если не меняете):</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ff6200',
                  borderRadius: '20px',
                  fontSize: '16px',
                  color: '#333333',
                  transition: 'border-color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = '#e65a00')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = '#ff6200')}
              />
            </div>
            <div>
              <label style={{ fontSize: '18px', color: '#333333', marginBottom: '8px', display: 'block' }}>Аватар:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ marginBottom: '12px' }}
              />
              {avatarPreview && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={avatarPreview}
                    alt="Avatar Preview"
                    style={{
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginTop: '12px',
                      display: 'block',
                    }}
                    onError={handleImageError}
                  />
                  {isAvatarUploading && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#FF6200',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        padding: '4px 8px',
                        borderRadius: '8px',
                      }}
                    >
                      Загрузка...
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                type="submit"
                style={{
                  backgroundColor: '#FF6200',
                  color: '#FFFFFF',
                  padding: '12px 24px',
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
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                style={{
                  backgroundColor: '#666666',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4A4A4A')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#666666')}
              >
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
                id="avatar-upload"
              />
              <label htmlFor="avatar-upload" style={{ display: 'block', textAlign: 'center' }}>
                {avatarPreview && !isAvatarUploading ? (
                  <img
                    src={avatarPreview}
                    alt="User Avatar"
                    style={{
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: '3px solid #ff6200',
                      transition: 'border-color 0.3s',
                      display: 'block',
                      margin: '0 auto',
                    }}
                    onError={handleImageError}
                    onMouseOver={(e) => (e.currentTarget.style.borderColor = '#e65a00')}
                    onMouseOut={(e) => (e.currentTarget.style.borderColor = '#ff6200')}
                  />
                ) : (
                  <div
                    style={{
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      backgroundColor: '#E0E0E0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      cursor: 'pointer',
                      border: '3px solid #ff6200',
                      transition: 'border-color 0.3s',
                      position: 'relative',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.borderColor = '#e65a00')}
                    onMouseOut={(e) => (e.currentTarget.style.borderColor = '#ff6200')}
                  >
                    <span style={{ fontSize: '48px', color: '#666666' }}>👤</span>
                    {isAvatarUploading && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          color: '#FF6200',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          padding: '4px 8px',
                          borderRadius: '8px',
                        }}
                      >
                        Загрузка...
                      </div>
                    )}
                  </div>
                )}
              </label>
            </div>
            <p><strong style={{ color: '#003087' }}>Имя:</strong> {user.name}</p>
            <p><strong style={{ color: '#003087' }}>Email:</strong> {user.email}</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={() => setEditMode(true)}
                style={{
                  backgroundColor: '#FF6200',
                  color: '#FFFFFF',
                  padding: '12px 24px',
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
                Редактировать
              </button>
              <button
                onClick={() => router.push('/orders')}
                style={{
                  backgroundColor: '#003087',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'semibold',
                  transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#002766')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#003087')}
              >
                Мои заказы
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                style={{
                  backgroundColor: '#666666',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4A4A4A')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#666666')}
              >
                Выйти
              </button>
            </div>
          </div>
        )}
      </div>

      {showLogoutConfirm && (
        <div
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center',
              maxWidth: '400px',
              width: '90%',
            }}
          >
            <h3 style={{ fontSize: '20px', color: '#333333', marginBottom: '16px' }}>
              Подтверждение выхода
            </h3>
            <p style={{ fontSize: '14px', color: '#666666', marginBottom: '24px' }}>
              Вы уверены, что хотите выйти?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: '#FF6200',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'semibold',
                  transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e65a00')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF6200')}
              >
                Да, выйти
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  backgroundColor: '#666666',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4A4A4A')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#666666')}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}