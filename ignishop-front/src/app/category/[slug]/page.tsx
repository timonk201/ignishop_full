'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '../../../store/cartStore';

export default function CategoryPage({ params }) {
  const { slug } = params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCartStore();

  const categoryProducts = {
    electronics: { id: 1, name: 'Телефон', price: 20000, category: 'electronics' },
    clothing: { id: 2, name: 'Футболка', price: 1500, category: 'clothing' },
    books: { id: 3, name: 'Книга', price: 500, category: 'books' },
    other: { id: 4, name: 'Чашка', price: 300, category: 'other' },
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const selectedProduct = categoryProducts[slug] || null;
      setProduct(selectedProduct);
      setLoading(false);
    }, 1000);
  }, [slug]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      alert(`${product.name} добавлен в корзину!`);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold text-[#333333] mb-6 capitalize">Категория: {slug}</h2>
      {loading ? (
        <p className="text-center text-[#333333]">Загрузка...</p>
      ) : product ? (
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow max-w-md mx-auto">
          <h3 className="font-semibold text-[#333333] text-xl mb-3">{product.name}</h3>
          <p className="text-[#FF6200] font-bold text-2xl mb-3">{product.price} $</p>
          <p className="text-sm text-gray-600 mb-4">{product.category}</p>
          <button
            onClick={handleAddToCart}
            className="w-full bg-[#FF6200] text-white py-2 rounded-full hover:bg-[#e65a00] transition-colors"
          >
            В корзину
          </button>
        </div>
      ) : (
        <p className="text-center text-[#333333]">Товары в этой категории не найдены</p>
      )}
    </div>
  );
}