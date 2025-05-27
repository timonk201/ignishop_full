// app/admin/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Category {
  id: number;
  key: string;
  name: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  category_id: number;
  subcategory_id: number | null;
  category: { id: number; name: string };
  subcategory: { id: number; name: string } | null;
  description: string;
  price: number | string;
  stock: number;
  image?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newProduct, setNewProduct] = useState({
    id: 0,
    name: '',
    category_id: 0,
    subcategory_id: null,
    description: '',
    price: 0,
    stock: 0,
    image: '',
    created_at: '',
    updated_at: '',
  });
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [editedProduct, setEditedProduct] = useState({
    id: 0,
    name: '',
    category_id: 0,
    subcategory_id: null,
    description: '',
    price: 0,
    stock: 0,
    image: '',
    created_at: '',
    updated_at: '',
  });

  // Загрузка категорий
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/categories');
        setCategories(response.data.data);
        if (response.data.data.length > 0) {
          setNewProduct((prev) => ({
            ...prev,
            category_id: response.data.data[0].id,
          }));
          setEditedProduct((prev) => ({
            ...prev,
            category_id: response.data.data[0].id,
          }));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        alert('Не удалось загрузить категории.');
      }
    };
    fetchCategories();
  }, []);

  // Загрузка списка товаров
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/products');
        const fetchedProducts = response.data.data.map((product: Product) => {
          console.log('Product image:', product.image); // Логируем путь к изображению
          return {
            ...product,
            price: parseFloat(product.price as string),
          };
        });
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        alert('Не удалось загрузить товары.');
      }
    };
    fetchProducts();
  }, []);

  // Обработка изменения полей для нового товара
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'category_id') {
      setNewProduct((prev) => ({
        ...prev,
        category_id: parseInt(value) || 0,
        subcategory_id: null, // Сбрасываем подкатегорию
      }));
    } else if (name === 'subcategory_id') {
      setNewProduct((prev) => ({
        ...prev,
        subcategory_id: value ? parseInt(value) : null,
      }));
    } else {
      setNewProduct((prev) => ({
        ...prev,
        [name]: name === 'price' ? parseFloat(value) || 0 : name === 'stock' ? parseInt(value) || 0 : value,
      }));
    }
  };

  // Обработка изменения полей для редактируемого товара
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'category_id') {
      setEditedProduct((prev) => ({
        ...prev,
        category_id: parseInt(value) || 0,
        subcategory_id: null, // Сбрасываем подкатегорию
      }));
    } else if (name === 'subcategory_id') {
      setEditedProduct((prev) => ({
        ...prev,
        subcategory_id: value ? parseInt(value) : null,
      }));
    } else {
      setEditedProduct((prev) => ({
        ...prev,
        [name]: name === 'price' ? parseFloat(value) || 0 : name === 'stock' ? parseInt(value) || 0 : value,
      }));
    }
  };

  // Обработка загрузки изображения для нового товара
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setNewProduct((prev) => ({ ...prev, image: file.name }));
    } else {
      alert('Пожалуйста, выберите файл в формате .jpg, .jpeg, .png, .gif или .webp');
    }
  };

  // Обработка загрузки изображения для редактируемого товара
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setEditedProduct((prev) => ({ ...prev, image: file.name }));
    } else {
      alert('Пожалуйста, выберите файл в формате .jpg, .jpeg, .png, .gif или .webp');
    }
  };

  // Добавление нового товара
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      newProduct.name &&
      newProduct.category_id &&
      newProduct.description &&
      newProduct.price &&
      newProduct.stock
    ) {
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('category_id', newProduct.category_id.toString());
      if (newProduct.subcategory_id) {
        formData.append('subcategory_id', newProduct.subcategory_id.toString());
      }
      formData.append('description', newProduct.description);
      formData.append('price', newProduct.price.toString());
      formData.append('stock', newProduct.stock.toString());
      const fileInput = (e.target as HTMLFormElement).querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        formData.append('image', fileInput.files[0]);
      }

      try {
        const response = await axios.post('http://localhost:8000/api/products', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const addedProduct = {
          ...response.data.data,
          price: parseFloat(response.data.data.price),
        };
        setProducts([...products, addedProduct]);
        setNewProduct({
          id: 0,
          name: '',
          category_id: categories.length > 0 ? categories[0].id : 0,
          subcategory_id: null,
          description: '',
          price: 0,
          stock: 0,
          image: '',
          created_at: '',
          updated_at: '',
        });
        alert('Товар успешно добавлен!');
      } catch (error) {
        console.error('Error adding product:', error.response?.data || error.message);
        alert('Не удалось добавить товар. Проверьте консоль для деталей.');
      }
    } else {
      alert('Пожалуйста, заполните все обязательные поля');
    }
  };

  // Редактирование товара
  const handleEdit = (product: Product) => {
    setEditProductId(product.id);
    setEditedProduct({
      ...product,
      category_id: product.category.id,
      subcategory_id: product.subcategory ? product.subcategory.id : null,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      editedProduct.name &&
      editedProduct.category_id &&
      editedProduct.description &&
      editedProduct.price &&
      editedProduct.stock
    ) {
      const formData = new FormData();
      formData.append('name', editedProduct.name);
      formData.append('category_id', editedProduct.category_id.toString());
      if (editedProduct.subcategory_id) {
        formData.append('subcategory_id', editedProduct.subcategory_id.toString());
      }
      formData.append('description', editedProduct.description);
      formData.append('price', editedProduct.price.toString());
      formData.append('stock', editedProduct.stock.toString());
      formData.append('_method', 'PUT');

      const fileInput = (e.target as HTMLFormElement).querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        formData.append('image', fileInput.files[0]);
      }

      try {
        const response = await axios.post(
          `http://localhost:8000/api/products/${editProductId}`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
        const updatedProduct = {
          ...response.data.data,
          price: parseFloat(response.data.data.price),
        };
        setProducts(products.map((p) => (p.id === editProductId ? updatedProduct : p)));
        setEditProductId(null);
        setEditedProduct({
          id: 0,
          name: '',
          category_id: categories.length > 0 ? categories[0].id : 0,
          subcategory_id: null,
          description: '',
          price: 0,
          stock: 0,
          image: '',
          created_at: '',
          updated_at: '',
        });
        alert('Товар успешно обновлен!');
      } catch (error) {
        console.error('Full error:', error);
        console.error('Error response:', error.response);
        console.error('Error message:', error.message);
        alert('Не удалось обновить товар. Проверьте консоль для деталей.');
      }
    } else {
      alert('Пожалуйста, заполните все обязательные поля');
    }
  };

  // Удаление товара
  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await axios.delete(`http://localhost:8000/api/products/${id}`);
        setProducts(products.filter((p) => p.id !== id));
        alert('Товар успешно удален!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Не удалось удалить товар.');
      }
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>
        Админ-панель
      </h2>

      {/* Форма для добавления товара */}
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>
          Добавить новый товар
        </h3>
        <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Название:</label>
            <input
              type="text"
              name="name"
              value={newProduct.name}
              onChange={handleChange}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Категория:</label>
            <select
              name="category_id"
              value={newProduct.category_id}
              onChange={handleChange}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Подкатегория:</label>
            <select
              name="subcategory_id"
              value={newProduct.subcategory_id || ''}
              onChange={handleChange}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
            >
              <option value="">Без подкатегории</option>
              {categories
                .find((cat) => cat.id === newProduct.category_id)
                ?.subcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Описание:</label>
            <textarea
              name="description"
              value={newProduct.description}
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
              value={newProduct.price}
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
              value={newProduct.stock}
              onChange={handleChange}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Изображение (.jpg, .jpeg, .png, .gif, .webp):</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageUpload}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
            />
          </div>
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
            Добавить товар
          </button>
        </form>
      </div>

      {/* Список текущих товаров */}
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>
        Текущие товары
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {product.image ? (
              <img
                src={`http://localhost:8000${product.image}`}
                alt={product.name}
                style={{ width: '100%', height: '12rem', objectFit: 'cover', borderRadius: '8px' }}
                onError={(e) => console.error(`Failed to load image for ${product.name}: ${product.image}`)}
              />
            ) : (
              <div style={{ height: '12rem', backgroundColor: '#e0e0e0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {product.name}
              </div>
            )}
            <div>
              <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333333', marginBottom: '8px' }}>
                {product.name}
              </h4>
              <p style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>
                Категория: {product.category.name}
              </p>
              <p style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>
                Подкатегория: {product.subcategory ? product.subcategory.name : 'Нет'}
              </p>
              <p style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>Описание: {product.description}</p>
              <p style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>
                Цена: ${typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(product.price).toFixed(2)}
              </p>
              <p style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>На складе: {product.stock}</p>
            </div>
            {editProductId === product.id ? (
              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  name="name"
                  value={editedProduct.name}
                  onChange={handleEditChange}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                  required
                />
                <select
                  name="category_id"
                  value={editedProduct.category_id}
                  onChange={handleEditChange}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                  required
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <select
                  name="subcategory_id"
                  value={editedProduct.subcategory_id || ''}
                  onChange={handleEditChange}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                >
                  <option value="">Без подкатегории</option>
                  {categories
                    .find((cat) => cat.id === editedProduct.category_id)
                    ?.subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                </select>
                <textarea
                  name="description"
                  value={editedProduct.description}
                  onChange={handleEditChange}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', minHeight: '80px' }}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={editedProduct.price}
                  onChange={handleEditChange}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                  required
                />
                <input
                  type="number"
                  name="stock"
                  value={editedProduct.stock}
                  onChange={handleEditChange}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                  required
                />
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Изображение (.jpg, .jpeg, .png, .gif, .webp):</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleEditImageUpload}
                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                  />
                </div>
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
                <button
                  type="button"
                  onClick={() => setEditProductId(null)}
                  style={{
                    backgroundColor: '#666666',
                    color: 'white',
                    padding: '8px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Отмена
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(product)}
                  style={{
                    backgroundColor: '#ff6200',
                    color: 'white',
                    padding: '8px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  Редактировать
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  style={{
                    backgroundColor: '#ff0000',
                    color: 'white',
                    padding: '8px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  Удалить
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}