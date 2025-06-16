'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';

interface Category {
  id: number;
  name: string;
  subcategories: {
    id: number;
    name: string;
  }[];
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  category_id: number;
  subcategory_id: number | null;
}

export default function EditProductPage() {
  const params = useParams();
  const id = params?.id;
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
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    fetchCategories();
    fetchProduct();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/categories');
      setCategories(response.data.data);
    } catch (err) {
      setError('Ошибка при загрузке категорий');
    }
  };

  const fetchProduct = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Вы не авторизованы');
        setLoading(false);
        return;
      }
      const response = await axios.get(`http://localhost:8000/api/seller/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const product = response.data;
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price !== undefined && product.price !== null ? product.price.toString() : '',
        stock: product.stock !== undefined && product.stock !== null ? product.stock.toString() : '',
        category_id: (product.category && product.category.id)
          ? product.category.id.toString()
          : (product.category_id !== undefined && product.category_id !== null ? product.category_id.toString() : ''),
        subcategory_id: (product.subcategory && product.subcategory.id)
          ? product.subcategory.id.toString()
          : (product.subcategory_id !== undefined && product.subcategory_id !== null ? product.subcategory_id.toString() : ''),
        image: null,
      });
      setImagePreview(product.image ? (product.image.startsWith('http') ? product.image : `http://localhost:8000${product.image}`) : null);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setError('Товар не найден или у вас нет доступа');
      } else {
        setError('Ошибка при загрузке товара: ' + (err as any)?.message);
      }
    } finally {
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
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('price', formData.price.toString().replace(',', '.').trim());
      formDataToSend.append('stock', formData.stock.toString().trim());
      formDataToSend.append('category_id', formData.category_id.toString().trim());
      if (formData.subcategory_id && formData.subcategory_id !== '') {
        formDataToSend.append('subcategory_id', formData.subcategory_id.toString().trim());
      }
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      formDataToSend.append('_method', 'PUT');
      await axios.post(`http://localhost:8000/api/seller/products/${id}`, formDataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push('/seller/products');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        setError('Ошибка при обновлении товара: ' + (err as any)?.message);
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
        Редактировать товар
      </h1>

      {error && (
        <div style={{ backgroundColor: '#FFE5E5', color: '#FF0000', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ fontSize: '16px', color: '#333', marginBottom: '8px', display: 'block' }}>
            Название товара:
          </label>
          {formErrors.name && <div style={{color:'red'}}>{formErrors.name[0]}</div>}
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
        </div>

        <div>
          <label style={{ fontSize: '16px', color: '#333', marginBottom: '8px', display: 'block' }}>
            Описание:
          </label>
          {formErrors.description && <div style={{color:'red'}}>{formErrors.description[0]}</div>}
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
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <label style={{ fontSize: '16px', color: '#333', marginBottom: '8px', display: 'block' }}>
              Цена ($):
            </label>
            {formErrors.price && <div style={{color:'red'}}>{formErrors.price[0]}</div>}
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
          </div>

          <div>
            <label style={{ fontSize: '16px', color: '#333', marginBottom: '8px', display: 'block' }}>
              Количество:
            </label>
            {formErrors.stock && <div style={{color:'red'}}>{formErrors.stock[0]}</div>}
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
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <label style={{ fontSize: '16px', color: '#333', marginBottom: '8px', display: 'block' }}>
              Категория:
            </label>
            {formErrors.category_id && <div style={{color:'red'}}>{formErrors.category_id[0]}</div>}
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
          </div>

          <div>
            <label style={{ fontSize: '16px', color: '#333', marginBottom: '8px', display: 'block' }}>
              Подкатегория: <span style={{color:'#888',fontWeight:'normal'}}>(необязательно)</span>
            </label>
            {formErrors.subcategory_id && <div style={{color:'red'}}>{formErrors.subcategory_id[0]}</div>}
            <select
              name="subcategory_id"
              value={formData.subcategory_id}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ff6200',
                borderRadius: '8px',
                fontSize: '16px',
              }}
            >
              <option value="">Выберите подкатегорию</option>
              {formData.category_id && categories
                .find(c => c.id === Number(formData.category_id))
                ?.subcategories.map(subcategory => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '16px', color: '#333', marginBottom: '8px', display: 'block' }}>
            Изображение:
          </label>
          {formErrors.image && <div style={{color:'red'}}>{formErrors.image[0]}</div>}
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
          >
            Сохранить изменения
          </button>
        </div>
      </form>
    </div>
  );
} 