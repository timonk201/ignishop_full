'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { useFavoriteStore } from '../../store/favoriteStore';
import { FaHeart, FaTrash, FaEdit } from 'react-icons/fa';

interface User {
  id?: number;
  name: string;
  email: string;
  avatar?: string;
  is_admin?: boolean;
}

interface Product {
  id: number;
  name: string;
  category: { name: string };
  subcategory: { name: string } | null;
  description: string;
  price: number;
  stock: number;
  image?: string;
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
  product: Product;
}

export default function ProfilePage() {
  const { refreshUser } = useUser();
  const { favorites, fetchFavorites, removeFromFavorites } = useFavoriteStore();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editAvatarMode, setEditAvatarMode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editReviewId, setEditReviewId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
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

    const fetchReviews = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/user/reviews', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReviews(response.data.data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchUser();
    fetchReviews();
    fetchFavorites();
  }, [router, cacheBuster]);

  useEffect(() => {
    const fetchFavoriteProducts = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/favorites', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setFavoriteProducts(response.data.data);
      } catch (error) {
        console.error('Error fetching favorite products:', error);
      }
    };

    if (showFavoritesModal) {
      fetchFavoriteProducts();
    }
  }, [showFavoritesModal, favorites]);

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

  const handleRemoveFromFavorites = async (productId: number) => {
    await removeFromFavorites(productId);
    setFavoriteProducts((prev) => prev.filter((product) => product.id !== productId));
  };

  const handleImageError = () => {
    setAvatarPreview(null);
    setIsAvatarUploading(false);
  };

  const handleEditReview = (review: Review) => {
    setEditReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReviewId || !user || editRating === 0) {
      alert('Пожалуйста, выберите оценку от 1 до 5.');
      return;
    }

    const data = {
      rating: editRating,
      comment: editComment || undefined,
    };

    console.log('Sending data:', data);

    try {
      const response = await axios.put(
        `http://localhost:8000/api/reviews/${editReviewId}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Безопасное обновление состояния
      setReviews(reviews.map(r =>
        r.id === editReviewId
          ? {
              ...r,
              ...response.data.data,
              product: response.data.data.product || r.product
            }
          : r
      ));
      setEditReviewId(null);
      setEditRating(0);
      setEditComment('');
      alert('Отзыв успешно обновлён!');
    } catch (error) {
      console.error('Error updating review:', error);
      if (error.response) {
        const errorMsg = error.response.data.message || error.response.data.errors?.rating?.[0] || 'Не удалось обновить отзыв.';
        alert(`Ошибка: ${errorMsg}`);
      } else {
        alert('Не удалось подключиться к серверу.');
      }
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот отзыв?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(reviews.filter(review => review.id !== reviewId));
      alert('Отзыв успешно удалён!');
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Не удалось удалить отзыв. Проверьте консоль для деталей.');
    }
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
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
              <button
                onClick={() => setShowFavoritesModal(true)}
                style={{
                  backgroundColor: '#FF0000',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'semibold',
                  transition: 'background-color 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#CC0000')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF0000')}
              >
                <FaHeart size={16} /> Избранное
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

      {reviews.length > 0 && (
        <div style={{ marginTop: '32px', padding: '32px', backgroundColor: '#F9F9F9', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#003087', marginBottom: '16px' }}>Мои отзывы</h3>
          {reviews.map((review) => (
            <div
              key={review.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333333' }}>
                  {review.product.name}
                </h4>
                <div>
                  {editReviewId === review.id ? (
                    <button
                      onClick={() => {
                        setEditReviewId(null);
                        setEditRating(0);
                        setEditComment('');
                      }}
                      style={{
                        backgroundColor: '#666666',
                        color: '#FFFFFF',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        cursor: 'pointer',
                        marginLeft: '8px',
                        transition: 'background-color 0.3s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4A4A4A')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#666666')}
                    >
                      Отмена
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditReview(review)}
                        style={{
                          backgroundColor: '#FF6200',
                          color: '#FFFFFF',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          border: 'none',
                          cursor: 'pointer',
                          marginLeft: '8px',
                          transition: 'background-color 0.3s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e65a00')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF6200')}
                      >
                        <FaEdit size={16} /> Редактировать
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        style={{
                          backgroundColor: '#FF0000',
                          color: '#FFFFFF',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          border: 'none',
                          cursor: 'pointer',
                          marginLeft: '8px',
                          transition: 'background-color 0.3s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#CC0000')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF0000')}
                      >
                        <FaTrash size={16} /> Удалить
                      </button>
                    </>
                  )}
                </div>
              </div>
              {editReviewId === review.id ? (
                <form onSubmit={handleUpdateReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  <label style={{ fontSize: '14px', color: '#666666' }}>Оценка (1-5):</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        onClick={() => setEditRating(star)}
                        style={{
                          fontSize: '24px',
                          color: star <= editRating ? '#FF6200' : '#ccc',
                          cursor: 'pointer',
                          transition: 'color 0.3s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.color = star <= editRating ? '#e65a00' : '#ccc')}
                        onMouseOut={(e) => (e.currentTarget.style.color = star <= editRating ? '#FF6200' : '#ccc')}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <label style={{ fontSize: '14px', color: '#666666' }}>Комментарий:</label>
                  <textarea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '100px' }}
                  />
                  <button
                    type="submit"
                    disabled={editRating === 0}
                    style={{
                      backgroundColor: '#FF6200',
                      color: '#FFFFFF',
                      padding: '12px',
                      borderRadius: '20px',
                      border: 'none',
                      cursor: editRating === 0 ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.3s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = editRating === 0 ? '#FF6200' : '#e65a00')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF6200')}
                  >
                    Сохранить
                  </button>
                </form>
              ) : (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#666666', marginBottom: '8px' }}>
                    Оценка: {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} style={{ color: i < review.rating ? '#FF6200' : '#ccc' }}>★</span>
                    ))}
                  </div>
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
                  <p style={{ fontSize: '12px', color: '#666666' }}>Дата: {new Date(review.created_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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

      {showFavoritesModal && (
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
          onClick={() => setShowFavoritesModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '24px', color: '#003087', marginBottom: '16px', textAlign: 'center' }}>
              Избранное
            </h3>
            {favoriteProducts.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: '16px', color: '#666666' }}>
                У вас пока нет избранных товаров.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                {favoriteProducts.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      backgroundColor: '#F9F9F9',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'transform 0.3s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {product.image ? (
                      <img
                        src={`http://localhost:8000${product.image}`}
                        alt={product.name}
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                        onError={(e) => console.error(`Failed to load image for ${product.name}: ${product.image}`)}
                      />
                    ) : (
                      <div style={{ width: '100px', height: '100px', backgroundColor: '#e0e0e0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {product.name}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h4
                        style={{ fontSize: '18px', fontWeight: 'bold', color: '#333333', marginBottom: '8px', cursor: 'pointer' }}
                        onClick={() => router.push(`/product/${product.id}`)}
                        onMouseOver={(e) => (e.currentTarget.style.color = '#FF6200')}
                        onMouseOut={(e) => (e.currentTarget.style.color = '#333333')}
                      >
                        {product.name}
                      </h4>
                      <p style={{ fontSize: '14px', color: '#666666', marginBottom: '8px' }}>
                        {product.category.name}{product.subcategory ? ` / ${product.subcategory.name}` : ''}
                      </p>
                      <p style={{ fontSize: '16px', color: '#FF6200', fontWeight: 'bold' }}>
                        {product.price} $
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromFavorites(product.id)}
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
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
              <button
                onClick={() => setShowFavoritesModal(false)}
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
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}