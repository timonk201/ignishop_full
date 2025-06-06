'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuthStore();
  const { refreshUser } = useUser();
  const [step, setStep] = useState<'email' | 'password' | 'register'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Введите email');
      return;
    }
    setError('');
    setStep('password');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:8000/api/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      await refreshUser();
      closeAuthModal();
      setStep('email');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при входе');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('http://localhost:8000/api/register', {
        name,
        email,
        password,
        is_admin: false,
      });
      setStep('email');
      setEmail('');
      setPassword('');
      setName('');
      alert('Регистрация успешна! Теперь войдите.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при регистрации');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleClose = () => {
    closeAuthModal();
    setStep('email');
    setEmail('');
    setPassword('');
    setName('');
    setError('');
  };

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleClose();
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <div
      style={{
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
      }}
      onClick={handleClickOutside}
    >
      <div
        ref={modalRef}
        style={{
          backgroundColor: '#FFFFFF',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          width: '400px',
          textAlign: 'center',
        }}
      >
        {step === 'email' && (
          <>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>
              Войдите, чтобы совершать покупки на IgniShop
            </h2>
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                style={{
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  outline: 'none',
                  fontSize: '14px',
                  color: '#333333',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                required
              />
              {error && <p style={{ color: '#FF0000', fontSize: '14px' }}>{error}</p>}
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
                Войти
              </button>
              <button
                type="button"
                onClick={() => setStep('register')}
                style={{
                  backgroundColor: '#666666',
                  color: '#FFFFFF',
                  padding: '12px',
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
                Создать аккаунт
              </button>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  backgroundColor: 'transparent',
                  color: '#666666',
                  padding: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textDecoration: 'underline',
                  transition: 'color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#FF6200')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#666666')}
              >
                Отмена
              </button>
            </form>
          </>
        )}

        {step === 'password' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setStep('email')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666666',
                  marginRight: '16px',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#FF6200')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#666666')}
              >
                <FaArrowLeft size={20} />
              </button>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333333', flex: 1 }}>
                Введите пароль
              </h2>
            </div>
            <p style={{ fontSize: '14px', color: '#666666', marginBottom: '16px' }}>
              Для аккаунта {email}
            </p>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Пароль"
                  style={{
                    padding: '8px 40px 8px 8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    outline: 'none',
                    fontSize: '14px',
                    color: '#333333',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666666',
                  }}
                >
                  {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>
              {error && <p style={{ color: '#FF0000', fontSize: '14px' }}>{error}</p>}
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
                Войти
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                style={{
                  backgroundColor: 'transparent',
                  color: '#666666',
                  padding: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textDecoration: 'underline',
                  transition: 'color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#FF6200')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#666666')}
              >
                Назад
              </button>
            </form>
          </>
        )}

        {step === 'register' && (
          <>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>
              Создать аккаунт
            </h2>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Имя"
                style={{
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  outline: 'none',
                  fontSize: '14px',
                  color: '#333333',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                required
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                style={{
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  outline: 'none',
                  fontSize: '14px',
                  color: '#333333',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                required
              />
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Пароль"
                  style={{
                    padding: '8px 40px 8px 8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    outline: 'none',
                    fontSize: '14px',
                    color: '#333333',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666666',
                  }}
                >
                  {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>
              {error && <p style={{ color: '#FF0000', fontSize: '14px' }}>{error}</p>}
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
                Зарегистрироваться
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                style={{
                  backgroundColor: 'transparent',
                  color: '#666666',
                  padding: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textDecoration: 'underline',
                  transition: 'color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#FF6200')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#666666')}
              >
                Назад
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}