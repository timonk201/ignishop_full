'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
}

export default function EditProduct() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const categories = ['electronics', 'clothing', 'books'];

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const response = await axios.get(`http://localhost:8000/api/products/${id}`);
          // Преобразуем price из строки в число
          const fetchedProduct = {
            ...response.data.data,
            price: parseFloat(response.data.data.price),
          };
          setProduct(fetchedProduct);
        } catch (error) {
          console.error('Error fetching product:', error);
          alert('Не удалось загрузить товар.');
        }
      };
      fetchProduct();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct((prev) =>
      prev
        ? {
            ...prev,
            [name]: name === 'price' ? parseFloat(value) || 0 : name === 'stock' ? parseInt(value) || 0 : value,
          }
        : null
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'image/jpeg') {
      setProduct((prev) => (prev ? { ...prev, image: file.name } : null));
    } else {
      alert('Пожалуйста, выберите файл в формате .jpg');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (product) {
      const formData = new FormData();
      formData.append('name', product.name);
      formData.append('category', product.category);
      formData.append('description', product.description);
      formData.append('price', product.price.toString());
      formData.append('stock', product.stock.toString());
      const fileInput = (e.target as HTMLFormElement).querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        formData.append('image', fileInput.files[0]);
      } else if (product.image) {
        formData.append('image', product.image);
      }

      try {
        await axios.post(`http://localhost:8000/api/products/${id}?_method=PUT`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Товар успешно обновлен!');
        router.push('/');
      } catch (error) {
        console.error('Error updating product:', error.response?.data || error.message);
        alert('Не удалось обновить товар.');
      }
    }
  };

  if (!product) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>
        Редактировать товар
      </h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Название:</label>
          <input
            type="text"
            name="name"
            value={product.name}
            onChange={handleChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Категория:</label>
          <select
            name="category"
            value={product.category}
            onChange={handleChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
            required
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Описание:</label>
          <textarea
            name="description"
            value={product.description}
            onChange={handleChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', minHeight: '80px' }}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Цена ($):</label>
          <input
            type="number"
            step="0.01"
            name="price"
            value={product.price}
            onChange={handleChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Количество на складе:</label>
          <input
            type="number"
            name="stock"
            value={product.stock}
            onChange={handleChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Изображение (.jpg):</label>
          <input
            type="file"
            accept="image/jpeg"
            onChange={handleImageUpload}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
          />
        </div>
        {product.image && (
          <img
            src={product.image.startsWith('http')
              ? product.image
              : (product.image.startsWith('/storage/')
                ? `http://localhost:8000${product.image}`
                : `http://localhost:8000/storage/${product.image}`)}
            alt={product.name}
            style={{ width: '100%', height: '200px', objectFit: 'cover', marginBottom: '16px' }}
          />
        )}
        <button
          type="submit"
          style={{
            backgroundColor: '#ff6200',
            color: 'white',
            padding: '8px',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Сохранить
        </button>
      </form>
    </div>
  );
}