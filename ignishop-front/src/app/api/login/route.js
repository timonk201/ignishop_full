// src/app/api/login/route.js
import { sign } from 'jsonwebtoken';

export async function POST(request) {
  const { email, password } = await request.json();

  // Моковая проверка (замените на реальную логику бэкенда позже)
  if (email === 'test@example.com' && password === 'password123') {
    const token = sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Используем process.env.JWT_SECRET
    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    return new Response(JSON.stringify({ message: 'Неверный email или пароль' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}