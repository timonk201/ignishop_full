'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import ProductCard from '../../components/ProductCard';

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

export interface Product {
  id: number;
  name: string;
  category: Category;
  subcategory: Subcategory | null;
  description: string;
  price: number;
  stock: number;
  image?: string;
  created_at: string;
  updated_at: string;
  average_rating?: number;
  total_reviews?: number;
}

export default function CategoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const category = params.category as string;
  const subcategory = searchParams.get('subcategory') || '';

  const [filters, setFilters] = useState({
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

  const perPage = 8;

  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setErrorShown(false);
    setLoadingMore(false);
    setIsFirstPageLoaded(false);
    fetchProducts(1, true);
  }, [category, subcategory, filters.fiveStarOnly, filters.fourStarAndAbove, sortOrder]);

  const fetchProducts = async (pageNum: number, reset = false) => {
    if (isFetching.current || (!reset && !hasMore)) return;
    isFetching.current = true;

    try {
      setLoadingMore(true);
      const params = {
        category: category || undefined,
        subcategory: subcategory || undefined,
        fiveStarOnly: filters.fiveStarOnly,
        fourStarAndAbove: filters.fourStarAndAbove,
        sort: sortOrder !== 'default' ? sortOrder : undefined,
        page: pageNum,
        per_page: perPage,
      };
      console.log('Request params:', params); // Отладка параметров
      const response = await axios.get('http://localhost:8000/api/products', { params });
      console.log('Fetched products response:', response.data);
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
    .filter((product) => {
      const matchesPrice = product.price >= filters.minPrice && product.price <= filters.maxPrice;
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

    if (name === 'minPrice') {
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
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontWeight: 'bold', color: '#333333', cursor: 'pointer' }}>
            <div style={{ position: 'relative', width: '16px', height: '16px', marginRight: '8px' }}>
              <input
                type="checkbox"
                name="fiveStarOnly"
                checked={filters.fiveStarOnly}
                onChange={handleFilterChange}
                style={{ position: 'absolute', opacity: 0, width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span
                style={{
                  display: 'block',
                  width: '16px',
                  height: '16px',
                  border: `2px solid ${filters.fiveStarOnly ? '#ff6200' : '#666666'}`,
                  borderRadius: '4px',
                  backgroundColor: filters.fiveStarOnly ? '#ff6200' : 'transparent',
                  transition: 'background-color 0.3s, border-color 0.3s',
                }}
              >
                {filters.fiveStarOnly && (
                  <svg
                    style={{ position: 'absolute', top: '1px', left: '1px', width: '12px', height: '12px', fill: 'none', stroke: '#ffffff', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }}
                    viewBox="0 0 24 24"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
            </div>
            Только с оценкой 5 звёзд
          </label>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontWeight: 'bold', color: '#333333', cursor: 'pointer' }}>
            <div style={{ position: 'relative', width: '16px', height: '16px', marginRight: '8px' }}>
              <input
                type="checkbox"
                name="fourStarAndAbove"
                checked={filters.fourStarAndAbove}
                onChange={handleFilterChange}
                style={{ position: 'absolute', opacity: 0, width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span
                style={{
                  display: 'block',
                  width: '16px',
                  height: '16px',
                  border: `2px solid ${filters.fourStarAndAbove ? '#ff6200' : '#666666'}`,
                  borderRadius: '4px',
                  backgroundColor: filters.fourStarAndAbove ? '#ff6200' : 'transparent',
                  transition: 'background-color 0.3s, border-color 0.3s',
                }}
              >
                {filters.fourStarAndAbove && (
                  <svg
                    style={{ position: 'absolute', top: '1px', left: '1px', width: '12px', height: '12px', fill: 'none', stroke: '#ffffff', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }}
                    viewBox="0 0 24 24"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', color: '#ff6200' }}>★★★★☆</span>
              <span style={{ fontSize: '14px', color: '#333333', marginLeft: '4px' }}>и более</span>
            </div>
          </label>
        </div>
      </div>

      <div style={{ flexGrow: '1' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333333' }}>
              Товары категории: {category}{subcategory ? ` / ${subcategory}` : ''}
            </h2>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px' }}>
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
          </div>
          {filteredProducts.length === 0 && !loadingMore && (
            <p style={{ textAlign: 'center', fontSize: '18px', color: '#333333' }}>
              Товары не найдены.
            </p>
          )}
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
    </div>
  );
}