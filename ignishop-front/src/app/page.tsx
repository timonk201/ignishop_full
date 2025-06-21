'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useCartStore } from '../store/cartStore';
import { useRouter } from 'next/navigation';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import ProductCard from './components/ProductCard';

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
  average_rating?: number;
  total_reviews?: number;
}

interface Banner {
  id: number;
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
    inStockOnly: true,
    fiveStarOnly: false,
    fourStarAndAbove: false,
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

  const perPage = 9;

  // Состояние для баннеров
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  const banners: Banner[] = [
    {
      id: 1,
      image: '/banners/LIning.png',
      link: '/category/shoes?subcategory=Спортивная%20обувь',
    },
    {
      id: 2,
      image: '/banners/AUto.png',
      link: '/category/auto',
    },
    {
      id: 3,
      image: '/banners/xiaomi.png',
      link: '/category/electronics?subcategory=Смартфоны',
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
  }, [filters.category, filters.subcategory, filters.fiveStarOnly, filters.fourStarAndAbove, sortOrder, filters.inStockOnly]);

  const fetchProducts = async (pageNum: number, reset = false) => {
    if (isFetching.current || (!reset && !hasMore)) return;
    isFetching.current = true;

    try {
      setLoadingMore(true);
      const params = {
        category: filters.category || undefined,
        subcategory: filters.subcategory || undefined,
        inStockOnly: filters.inStockOnly,
        fiveStarOnly: filters.fiveStarOnly,
        fourStarAndAbove: filters.fourStarAndAbove,
        sort: sortOrder !== 'default' ? sortOrder : undefined,
        page: pageNum,
        per_page: perPage,
      };
      const response = await axios.get('http://localhost:8000/api/products', { params });
      const fetchedProducts = response.data.data.map((product: Product) => ({
        ...product,
        price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      }));
      setTotalProducts(response.data.total || 0);

      setProducts((prev) => {
        const newProducts = reset ? fetchedProducts : [...prev, ...fetchedProducts];
        return newProducts.filter((item: Product, index: number, self: Product[]) =>
          index === self.findIndex((t: Product) => t.id === item.id)
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
    const observer = new IntersectionObserver(
      (entries) => {
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
    .filter((product: Product) => {
      const matchesPrice = product.price >= filters.minPrice && product.price <= filters.maxPrice;
      return matchesPrice;
    })
    .sort((a: Product, b: Product) => {
      if (sortOrder === 'asc') return a.price - b.price;
      if (sortOrder === 'desc') return b.price - a.price;
      return 0;
    });

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let newMinPrice = filters.minPrice;
    let newMaxPrice = filters.maxPrice;

    if (name === 'category') {
      setFilters((prev) => ({
        ...prev,
        category: value,
        subcategory: '',
      }));
    } else if (name === 'subcategory') {
      setFilters((prev) => ({
        ...prev,
        subcategory: value,
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
    } else if (type === 'checkbox' && 'checked' in e.target) {
      setFilters((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value);
  };

  const handlePrevBanner = () => {
    setSlideDirection('right');
    setCurrentBannerIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNextBanner = () => {
    setSlideDirection('left');
    setCurrentBannerIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index: number) => {
    setSlideDirection(index > currentBannerIndex ? 'left' : 'right');
    setCurrentBannerIndex(index);
  };

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      handleNextBanner();
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered]);

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
              padding: '10px 16px',
              border: '2px solid #ff6200',
              borderRadius: '25px',
              width: '100%',
              backgroundColor: '#fff',
              fontSize: '15px',
              color: '#333',
              cursor: 'pointer',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
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
                padding: '10px 16px',
                border: '2px solid #ff6200',
                borderRadius: '25px',
                width: '100%',
                backgroundColor: '#fff',
                fontSize: '15px',
                color: '#333',
                cursor: 'pointer',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
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
                padding: '10px',
                border: '2px solid #ff6200',
                borderRadius: '25px',
                width: '100px',
                fontSize: '15px',
                color: '#333',
                outline: 'none',
                textAlign: 'center',
                backgroundColor: '#fff',
                transition: 'border-color 0.2s, box-shadow 0.2s',
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
                padding: '10px',
                border: '2px solid #ff6200',
                borderRadius: '25px',
                width: '100px',
                fontSize: '15px',
                color: '#333',
                outline: 'none',
                textAlign: 'center',
                backgroundColor: '#fff',
                transition: 'border-color 0.2s, box-shadow 0.2s',
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
              value={Array.isArray([filters.minPrice, filters.maxPrice]) ? [filters.minPrice, filters.maxPrice] : [0, 1000]}
              onChange={(value) => {
                const arr = Array.isArray(value) ? value as number[] : [0, 1000];
                setFilters((prev) => ({ ...prev, minPrice: arr[0], maxPrice: arr[1] }));
              }}
              railStyle={{ backgroundColor: '#e0e0e0', height: 8 }}
              trackStyle={[{ backgroundColor: '#ff6200', height: 8 }]}
              handleStyle={[
                { borderColor: '#ff6200', backgroundColor: '#ff6200', borderWidth: 3, width: 20, height: 20, marginTop: -6 },
                { borderColor: '#ff6200', backgroundColor: '#ff6200', borderWidth: 3, width: 20, height: 20, marginTop: -6 },
              ]}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label>
            <input
              type="checkbox"
              name="inStockOnly"
              checked={filters.inStockOnly}
              onChange={handleFilterChange}
              style={{ display: 'none' }}
            />
            <div style={{
              padding: '10px 16px',
              borderRadius: '10px',
              fontWeight: 600,
              textAlign: 'center',
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer',
              ...(filters.inStockOnly
                ? { backgroundColor: '#ff6200', color: '#fff', border: '2px solid #ff6200' }
                : { backgroundColor: '#fff', color: '#333', border: '2px solid #ddd' })
            }}>
              Только в наличии
            </div>
          </label>
          <label>
            <input
              type="checkbox"
              name="fiveStarOnly"
              checked={filters.fiveStarOnly}
              onChange={handleFilterChange}
              style={{ display: 'none' }}
            />
            <div style={{
              padding: '10px 16px',
              borderRadius: '10px',
              fontWeight: 600,
              textAlign: 'center',
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer',
              ...(filters.fiveStarOnly
                ? { backgroundColor: '#ff6200', color: '#fff', border: '2px solid #ff6200' }
                : { backgroundColor: '#fff', color: '#333', border: '2px solid #ddd' })
            }}>
              Только 5 звёзд
            </div>
          </label>
          <label>
            <input
              type="checkbox"
              name="fourStarAndAbove"
              checked={filters.fourStarAndAbove}
              onChange={handleFilterChange}
              style={{ display: 'none' }}
            />
            <div style={{
              padding: '10px 16px',
              borderRadius: '10px',
              fontWeight: 600,
              textAlign: 'center',
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer',
              ...(filters.fourStarAndAbove
                ? { backgroundColor: '#ff6200', color: '#fff', border: '2px solid #ff6200' }
                : { backgroundColor: '#fff', color: '#333', border: '2px solid #ddd' })
            }}>
              4 звезды и выше
            </div>
          </label>
        </div>
      </div>

      <div style={{ flexGrow: '1' }}>
        <div
          style={{
            position: 'relative',
            marginBottom: '24px',
            overflow: 'hidden',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingTop: '40%', // Aspect Ratio
              overflow: 'hidden',
              borderRadius: '24px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              cursor: 'pointer',
            }}
            onClick={() => handleBannerClick(banners[currentBannerIndex].link)}
          >
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${banner.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: index === currentBannerIndex ? 1 : 0,
                  transition: 'opacity 0.8s ease-in-out',
                }}
              />
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBannerClick(banners[currentBannerIndex].link);
              }}
              style={{
                position: 'absolute',
                bottom: '15%',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '14px 32px',
                fontSize: '18px',
                fontWeight: 700,
                color: '#fff',
                background: 'linear-gradient(90deg, #ff6200 0%, #ff9d2f 100%)',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                transition: 'transform 0.3s, box-shadow 0.3s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.3)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
              }}
            >
              Перейти к товарам
            </button>
          </div>
          {/* Стрелки */}
          {isHovered && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevBanner();
                }}
                style={{
                  position: 'absolute', top: '50%', left: '18px', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                  width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: '#ff6200', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  zIndex: 2, transition: 'background 0.2s',
                }}
              >&#8592;</button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextBanner();
                }}
                style={{
                  position: 'absolute', top: '50%', right: '18px', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                  width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: '#ff6200', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  zIndex: 2, transition: 'background 0.2s',
                }}
              >&#8594;</button>
            </>
          )}
          {/* Индикаторы (кружочки) */}
          <div
            style={{
              position: 'absolute', bottom: '20px', left: '50%',
              transform: 'translateX(-50%)', display: 'flex',
              gap: '10px', zIndex: 2,
            }}
          >
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDotClick(idx);
                }}
                style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: idx === currentBannerIndex ? '#ff6200' : 'rgba(255,255,255,0.7)',
                  border: 'none', cursor: 'pointer', transition: 'background 0.2s',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <Link href="/game" style={{ textDecoration: 'none' }}>
            <button
              style={{
                padding: '18px 36px',
                fontSize: '18px',
                fontWeight: 700,
                color: '#fff',
                background: 'linear-gradient(135deg, #ff6200 0%, #ff9d2f 50%, #ff6200 100%)',
                border: 'none',
                borderRadius: '60px',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(255, 98, 0, 0.3)',
                transition: 'all 0.3s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '280px',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 98, 0, 0.4)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #ff9d2f 0%, #ff6200 50%, #ff9d2f 100%)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 98, 0, 0.3)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #ff6200 0%, #ff9d2f 50%, #ff6200 100%)';
              }}
            >
              Ежемесячные задания
            </button>
          </Link>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div></div>
            <select
              value={sortOrder}
              onChange={handleSortChange}
              style={{
                padding: '12px 24px',
                border: '2px solid #ff6200',
                borderRadius: '25px',
                backgroundColor: '#fff',
                fontSize: '15px',
                color: '#333',
                cursor: 'pointer',
                fontWeight: 600,
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = '#e65a00')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = '#ff6200')}
            >
              <option value="default">Сортировать</option>
              <option value="asc">По возрастанию цены</option>
              <option value="desc">По убыванию цены</option>
            </select>
          </div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '32px',
          justifyContent: 'center',
        }}>
          {filteredProducts.map((product, index) => (
            <ProductCard key={`${product.id}-${index}`} product={product} />
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