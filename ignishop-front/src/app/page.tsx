'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useCartStore } from '../store/cartStore';
import { useRouter } from 'next/navigation';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

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
  category: { key: string; name: string };
  subcategory: { name: string } | null;
  description: string;
  price: number;
  stock: number;
  image?: string;
  created_at: string;
  updated_at: string;
}

interface Banner {
  id: number;
  title: string;
  description: string;
  image: string;
  link: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const { fetchCart } = useCartStore();
  const router = useRouter();

  const [filters, setFilters] = useState({
    category: '',
    subcategory: '',
    minPrice: 0,
    maxPrice: 1000,
    inStockOnly: false,
  });

  const [sortOrder, setSortOrder] = useState('default');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [errorShown, setErrorShown] = useState(false);
  const [isFirstPageLoaded, setIsFirstPageLoaded] = useState(false);
  const observerTarget = useRef<HTMLDivElement | null>(null);
  const isFetching = useRef(false);

  const perPage = 8;

  // Состояние для баннеров
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  // Обновлённые данные для баннеров с русскими названиями подкатегорий
  const banners: Banner[] = [
    {
      id: 1,
      title: 'Ноутбуки со скидкой до 50%!',
      description: 'Обновите свой гаджет прямо сейчас!',
      image: '/banners/laptop.jpg',
      link: '/category/electronics?subcategory=Ноутбуки',
    },
    {
      id: 2,
      title: 'Сезонная распродажа одежды!',
      description: 'Скидки до 70% на модные коллекции!',
      image: '/banners/clothing.jpg',
      link: '/category/clothing',
    },
    {
      id: 3,
      title: 'Спортивная одежда для активного отдыха!',
      description: 'Подготовьтесь к лету с нами!',
      image: '/banners/sports.jpg',
      link: '/category/sports?subcategory=Спортивная одежда',
    },
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/categories');
        setCategories(response.data.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        if (!errorShown) {
          alert('Не удалось загрузить категории.');
          setErrorShown(true);
        }
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setErrorShown(false);
    setLoadingMore(false);
    setIsFirstPageLoaded(false);
    fetchProducts(1, true);
  }, [filters.category, filters.subcategory]);

  const fetchProducts = async (pageNum: number, reset = false) => {
    if (isFetching.current || (!reset && !hasMore)) return;
    isFetching.current = true;

    try {
      setLoadingMore(true);
      const params = {
        category: filters.category || undefined,
        subcategory: filters.subcategory || undefined,
        page: pageNum,
        per_page: perPage,
      };
      const response = await axios.get('http://localhost:8000/api/products', { params });
      console.log('Fetched products:', response.data);
      const fetchedProducts = response.data.data.map((product: Product) => ({
        ...product,
        price: parseFloat(product.price as string),
      }));
      setTotalProducts(response.data.total || 0);

      setProducts((prev) => {
        const newProducts = reset ? fetchedProducts : [...prev, ...fetchedProducts];
        return newProducts.filter((item, index, self) =>
          index === self.findIndex((t) => t.id === item.id)
        );
      });

      setHasMore(pageNum < response.data.last_page);
      if (pageNum === 1) {
        if (fetchedProducts.length > 0) {
          const maxProductPrice = Math.max(...fetchedProducts.map((p: Product) => p.price), 1000);
          setFilters((prev) => ({
            ...prev,
            maxPrice: maxProductPrice,
          }));
        }
        setIsFirstPageLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      if (!errorShown) {
        alert('Не удалось загрузить товары.');
        setErrorShown(true);
      }
    } finally {
      setLoadingMore(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        console.log('Observer triggered:', { isIntersecting: entries[0].isIntersecting, hasMore, loadingMore, isFetching: isFetching.current, isFirstPageLoaded });
        if (entries[0].isIntersecting && hasMore && !loadingMore && !isFetching.current && isFirstPageLoaded) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchProducts(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget && isFirstPageLoaded) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, isFirstPageLoaded]);

  const filteredProducts = products
    .filter((product) => {
      const matchesPrice =
        product.price >= filters.minPrice && product.price <= filters.maxPrice;
      const matchesStock = !filters.inStockOnly || product.stock > 0;
      return matchesPrice && matchesStock;
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.price - b.price;
      if (sortOrder === 'desc') return b.price - a.price;
      return 0;
    });

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    let newMinPrice = filters.minPrice;
    let newMaxPrice = filters.maxPrice;

    if (name === 'category') {
      setFilters((prev) => ({
        ...prev,
        category: value,
        subcategory: '',
      }));
    } else if (name === 'minPrice') {
      newMinPrice = parseFloat(value) || 0;
      if (newMinPrice > filters.maxPrice) newMaxPrice = newMinPrice;
      setFilters((prev) => ({
        ...prev,
        minPrice: newMinPrice,
        maxPrice: newMaxPrice,
      }));
    } else if (name === 'maxPrice') {
      newMaxPrice = parseFloat(value) || Math.max(...products.map((p) => p.price), 1000);
      if (newMaxPrice < filters.minPrice) newMinPrice = newMaxPrice;
      setFilters((prev) => ({
        ...prev,
        minPrice: newMinPrice,
        maxPrice: newMaxPrice,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value);
  };

  // Функции для управления баннерами
  const handlePrevBanner = () => {
    setSlideDirection('right');
    setCurrentBannerIndex((prev) =>
      prev === 0 ? banners.length - 1 : prev - 1
    );
  };

  const handleNextBanner = () => {
    setSlideDirection('left');
    setCurrentBannerIndex((prev) =>
      prev === banners.length - 1 ? 0 : prev + 1
    );
  };

  const handleDotClick = (index: number) => {
    setSlideDirection(index > currentBannerIndex ? 'left' : 'right');
    setCurrentBannerIndex(index);
  };

  // Автоматическое перелистывание
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      handleNextBanner();
    }, 5000); // Перелистывание каждые 5 секунд
    return () => clearInterval(interval);
  }, [isHovered]);

  // Обработка клика по баннеру
  const handleBannerClick = (link: string) => {
    router.push(link);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', display: 'flex', gap: '16px' }}>
      <div
        style={{
          width: '250px',
          padding: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333333', marginBottom: '16px', textAlign: 'center' }}>
          Фильтры
        </h3>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333333' }}>
            Категория:
          </label>
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            style={{
              padding: '10px',
              border: '2px solid #ff6200',
              borderRadius: '20px',
              width: '100%',
              backgroundColor: '#fff',
              fontSize: '14px',
              color: '#333333',
              cursor: 'pointer',
              transition: 'border-color 0.3s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#e65a00')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = '#ff6200')}
          >
            <option value="">Все</option>
            {categories.map((category) => (
              <option key={category.id} value={category.key}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        {filters.category && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333333' }}>
              Подкатегория:
            </label>
            <select
              name="subcategory"
              value={filters.subcategory}
              onChange={handleFilterChange}
              style={{
                padding: '10px',
                border: '2px solid #ff6200',
                borderRadius: '20px',
                width: '100%',
                backgroundColor: '#fff',
                fontSize: '14px',
                color: '#333333',
                cursor: 'pointer',
                transition: 'border-color 0.3s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = '#e65a00')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = '#ff6200')}
            >
              <option value="">Все</option>
              {categories
                .find((cat) => cat.key === filters.category)
                ?.subcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.name}>
                    {subcategory.name}
                  </option>
                ))}
            </select>
          </div>
        )}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333333' }}>
            Цена:
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              min="0"
              style={{
                padding: '8px',
                border: '2px solid #ff6200',
                borderRadius: '20px 0 0 20px',
                width: '100px',
                fontSize: '14px',
                color: '#333333',
                outline: 'none',
                textAlign: 'center',
                transition: 'border-color 0.3s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = '#e65a00')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = '#ff6200')}
            />
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              min={filters.minPrice}
              style={{
                padding: '8px',
                border: '2px solid #ff6200',
                borderRadius: '0 20px 20px 0',
                width: '100px',
                fontSize: '14px',
                color: '#333333',
                outline: 'none',
                textAlign: 'center',
                transition: 'border-color 0.3s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = '#e65a00')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = '#ff6200')}
            />
          </div>
          <div style={{ marginTop: '8px' }}>
            <Slider
              range
              min={0}
              max={Math.max(...products.map((p) => p.price), 1000)}
              value={[filters.minPrice, filters.maxPrice]}
              onChange={(value) => {
                setFilters((prev) => ({
                  ...prev,
                  minPrice: value[0],
                  maxPrice: value[1],
                }));
              }}
              railStyle={{ backgroundColor: '#e0e0e0', height: '6px' }}
              trackStyle={[{ backgroundColor: '#ff0000', height: '6px' }]}
              handleStyle={[
                { borderColor: '#ff0000', backgroundColor: '#fff', borderWidth: '2px', width: '16px', height: '16px', marginTop: '-5px' },
                { borderColor: '#ff0000', backgroundColor: '#fff', borderWidth: '2px', width: '16px', height: '16px', marginTop: '-5px' },
              ]}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontWeight: 'bold', color: '#333333', cursor: 'pointer' }}>
            <div style={{ position: 'relative', width: '16px', height: '16px', marginRight: '8px' }}>
              <input
                type="checkbox"
                name="inStockOnly"
                checked={filters.inStockOnly}
                onChange={handleFilterChange}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                }}
              />
              <span
                style={{
                  display: 'block',
                  width: '16px',
                  height: '16px',
                  border: `2px solid ${filters.inStockOnly ? '#ff6200' : '#666666'}`,
                  borderRadius: '4px',
                  backgroundColor: filters.inStockOnly ? '#ff6200' : 'transparent',
                  transition: 'background-color 0.3s, border-color 0.3s',
                }}
              >
                {filters.inStockOnly && (
                  <svg
                    style={{
                      position: 'absolute',
                      top: '1px',
                      left: '1px',
                      width: '12px',
                      height: '12px',
                      fill: 'none',
                      stroke: '#ffffff',
                      strokeWidth: '2',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                    }}
                    viewBox="0 0 24 24"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
            </div>
            Только в наличии
          </label>
        </div>
      </div>

      <div style={{ flexGrow: '1' }}>
        <div
          style={{
            position: 'relative',
            backgroundColor: '#fffacd',
            padding: '24px',
            borderRadius: '8px',
            marginBottom: '24px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div style={{ position: 'relative', width: '100%', height: '250px', overflow: 'hidden' }}>
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                onClick={() => handleBannerClick(banner.link)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '24px',
                  transform:
                    index === currentBannerIndex
                      ? 'translateX(0)'
                      : slideDirection === 'left'
                      ? `translateX(${index > currentBannerIndex ? '100%' : '-100%'})`
                      : `translateX(${index < currentBannerIndex ? '-100%' : '100%'})`,
                  opacity: index === currentBannerIndex ? 1 : 0,
                  transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
                  cursor: 'pointer',
                }}
              >
                <div style={{ paddingBottom: '16px' }}>
                  <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#000000' }}>
                    {banner.title}
                  </h2>
                  <p style={{ fontSize: '18px', color: '#000000' }}>{banner.description}</p>
                  <button
                    style={{
                      marginTop: '16px',
                      backgroundColor: '#ff6200',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '20px',
                      border: 'none',
                      cursor: 'pointer',
                      minHeight: '48px',
                      transition: 'background-color 0.3s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e65a00')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ff6200')}
                  >
                    Смотреть >
                  </button>
                </div>
                <div style={{ width: '50%', height: '200px', overflow: 'hidden', borderRadius: '8px' }}>
                  <img
                    src={banner.image}
                    alt={banner.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => (e.currentTarget.src = '/placeholder-banner.jpg')}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Стрелки */}
          {isHovered && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handlePrevBanner();
                }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '10px',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: '#ff6200',
                  transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)')}
              >
                ←
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleNextBanner();
                }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '10px',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: '#ff6200',
                  transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)')}
              >
                →
              </button>
            </>
          )}

          {/* Индикаторы (кружочки) */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '8px',
            }}
          >
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  handleDotClick(index);
                }}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: index === currentBannerIndex ? '#ff6200' : 'rgba(255, 255, 255, 0.5)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                }}
              />
            ))}
          </div>

          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '8px',
              backgroundColor: '#ff0000',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#ff0000',
              marginBottom: '16px',
            }}
          >
            Главные скидки
          </h3>
          <select
            value={sortOrder}
            onChange={handleSortChange}
            style={{
              padding: '10px',
              border: '2px solid #ff6200',
              borderRadius: '20px',
              backgroundColor: '#fff',
              fontSize: '14px',
              color: '#333333',
              cursor: 'pointer',
              transition: 'border-color 0.3s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#e65a00')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = '#ff6200')}
          >
            <option value="default">Сортировать</option>
            <option value="asc">По возрастанию цены</option>
            <option value="desc">По убыванию цены</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          {filteredProducts.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                transition: 'transform 0.3s',
                cursor: 'pointer',
              }}
              onClick={() => router.push(`/product/${product.id}`)}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {product.image ? (
                <img
                  src={`http://localhost:8000${product.image}`}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '12rem',
                    objectFit: 'cover',
                    borderRadius: '8px 8px 0 0',
                  }}
                  onError={(e) =>
                    console.error(
                      `Failed to load image for ${product.name}: ${product.image}`
                    )
                  }
                />
              ) : (
                <div
                  style={{
                    height: '12rem',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '8px 8px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {product.name}
                </div>
              )}
              <div style={{ padding: '16px' }}>
                <h4
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#333333',
                    marginBottom: '8px',
                  }}
                >
                  {product.name}
                </h4>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#666666',
                    marginBottom: '8px',
                  }}
                >
                  {product.category.name}
                  {product.subcategory ? ` / ${product.subcategory.name}` : ''}
                </p>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#666666',
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {product.description}
                </p>
                <p
                  style={{
                    width: '100',
                    textAlign: 'center',
                    fontSize: '16px',
                    color: '#333333',
                    padding: '8px 0',
                  }}
                >
                  Цена: {product.price} $
                </p>
              </div>
            </div>
          ))}
        </div>
        {loadingMore && (
          <p style={{ textAlign: 'center', fontSize: '18px', color: '#333333', marginTop: '16px' }}>
            Загрузка...
          </p>
        )}
        {!hasMore && filteredProducts.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: '18px', color: '#666666', marginTop: '16px' }}>
            Больше товаров нет.
          </p>
        )}
        <div ref={observerTarget} style={{ height: '20px' }} />
      </div>
    </div>
  );
}