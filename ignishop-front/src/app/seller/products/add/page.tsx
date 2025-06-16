'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Category {
  id: number;
  name: string;
  subcategories: {
    id: number;
    name: string;
  }[];
}

export default function AddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    subcategory_id: '',
    image: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/categories');
      setCategories(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке категорий');
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormErrors({});
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Вы не авторизованы');
        setLoading(false);
        return;
      }
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price.toString());
      formDataToSend.append('stock', formData.stock.toString());
      formDataToSend.append('category_id', formData.category_id.toString());
      if (formData.subcategory_id) {
        formDataToSend.append('subcategory_id', formData.subcategory_id.toString());
      }
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      await axios.post('http://localhost:8000/api/seller/products', formDataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push('/seller/products');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        setError('Ошибка при добавлении товара: ' + (err as any)?.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
      <h1 style={{ fontSize: '32px', color: '#003087', fontWeight: 'bold', marginBottom: '32px' }}>
        Добавить новый товар
      </h1>

      {error && (
        <div style={{ backgroundColor: '#FFE5E5', color: '#FF0000', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ fontSize: '16px', color: '#333', marginBottom: '8px', display: 'block' }}>
            Название товара*:
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #ff6200',
              borderRadius: '8px',
              fontSize: '16px',
            }}
          />
          {formErrors.name && <div style={{ color: 'red' }}>{formErrors.name[0]}</div>}
        </div>

        <div>
          <label style={{ fontSize: '16px', color: '#333', marginBottom: '8px', display: 'block' }}>
            Описание*:
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #ff6200',
              borderRadius: '8px',
              fontSize: '16px',
              minHeight: '120px',
            }}
          />
          {formErrors.description && <div style={{ color: 'red' }}>{formErrors.description[0]}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <label style={{ fontSize: '16px', color: '#333', marginBottom: '8px', display: 'block' }}>
              Цена ($)*:
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ff6200',
                borderRadius: '8px',
                fontSize: '16px',
              }}
            />
            {formErrors.price && <div style={{ color: 'red' }}>{formErrors.price[0]}</div>}
          </div>

          <div>
            <label style={{ fontSize: '16px', color: '#333', marginBottom: '8px', display: 'block' }}>
              Количество*:
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              required
              min="0"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ff6200',
                borderRadius: '8px',
                fontSize: '16px',
              }}
            />
            {formErrors.stock && <div style={{ color: 'red' }}>{formErrors.stock[0]}</div>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <label style={{ fontSize: '16px', color: '#333', marginBottom: '8px', display: 'block' }}>
              Категория*:
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ff6200',
                borderRadius: '8px',
                fontSize: '16px',
              }}
            >
              <option value="">Выберите категорию</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {formErrors.category_id && <div style={{ color: 'red' }}>{formErrors.category_id[0]}</div>}
          </div>

          <div>
            <label style={{ fontSize: '16px', color: '#333', marginBottom: '8px', display: 'block' }}>
              Подкатегория (необязательно):
            </label>
            <select
              name="subcategory_id"
              value={formData.subcategory_id || ''}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ff6200',
                borderRadius: '8px',
                fontSize: '16px',
              }}
            >
              <option value="">Без подкатегории</option>
              {formData.category_id && categories
                .find(c => c.id === Number(formData.category_id))
                ?.subcategories.map(subcategory => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
            </select>
            {formErrors.subcategory_id && <div style={{ color: 'red' }}>{formErrors.subcategory_id[0]}</div>}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '16px', color: '#333', marginBottom: '8px', display: 'block' }}>
            Изображение:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ marginBottom: '16px' }}
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              style={{
                maxWidth: '200px',
                maxHeight: '200px',
                objectFit: 'cover',
                borderRadius: '8px',
              }}
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => router.push('/seller/products')}
            style={{
              backgroundColor: '#666666',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Отмена
          </button>
          <button
            type="submit"
            style={{
              backgroundColor: '#FF6200',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
            }}
            disabled={loading}
          >
            Создать товар
          </button>
        </div>
      </form>
    </div>
  );
} 