// app/context/UserContext.jsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const fetchUser = async () => {
        try {
          const response = await fetch('http://localhost:8000/api/user', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        } catch (err) {
          console.error('Ошибка загрузки пользователя:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      };
      fetchUser();
    }
  }, []);

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('http://localhost:8000/api/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } else {
          throw new Error('Не удалось обновить пользователя');
        }
      } catch (err) {
        console.error('Ошибка при обновлении пользователя:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
  };

  return (
    <UserContext.Provider value={{ user, refreshUser, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);