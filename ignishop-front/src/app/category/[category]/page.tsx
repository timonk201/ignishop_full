'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSearchParams, useParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const params = useParams();
  const category = params.category as string;

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
  }, [category, searchParams, filters.inStockOnly, filters.fiveStarOnly, filters.fourStarAndAbove, sortOrder]);

  const fetchProducts = async (pageNum: number, reset = false) => {
    if (isFetching.current || (!reset && !hasMore)) return;
    isFetching.current = true;

    try {
      setLoadingMore(true);
      const subcategory = searchParams.get('subcategory') || undefined;
      const apiParams = {
        category,
        subcategory,
        inStockOnly: filters.inStockOnly,
        fiveStarOnly: filters.fiveStarOnly,
        fourStarAndAbove: filters.fourStarAndAbove,
        sort: sortOrder !== 'default' ? sortOrder : undefined,
        page: pageNum,
        per_page: perPage,
      };

      const response = await axios.get('http://localhost:8000/api/products', { params: apiParams });
      
      const fetchedProducts = response.data.data.map((product: any) => ({
        ...product,
        price: parseFloat(product.price),
      }));

      setProducts(prev => {
        const newProducts = reset ? fetchedProducts : [...prev, ...fetchedProducts];
        return newProducts.filter((item: Product, index: number, self: Product[]) =>
          index === self.findIndex((t: Product) => t.id === item.id)
        );
      });

      setTotalProducts(response.data.total || 0);
      setHasMore(pageNum < response.data.last_page);
      
      if (reset && fetchedProducts.length > 0) {
          const maxProductPrice = Math.max(...fetchedProducts.map((p: Product) => p.price), 1000);
        setFilters(prev => ({ ...prev, maxPrice: maxProductPrice }));
      }
      setIsFirstPageLoaded(true);

    } catch (error) {
      console.error('Error fetching products:', error);
        alert('Не удалось загрузить товары.');
    } finally {
      setLoadingMore(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !isFetching.current && isFirstPageLoaded) {
          setPage(prevPage => {
            const nextPage = prevPage + 1;
            fetchProducts(nextPage, false);
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
  }, [hasMore, loadingMore, isFirstPageLoaded, fetchProducts]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox' && 'checked' in e.target) {
      setFilters(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value);
  };
  
  const filteredProducts = products
    .filter(product => product.price >= filters.minPrice && product.price <= filters.maxPrice)
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.price - b.price;
      if (sortOrder === 'desc') return b.price - a.price;
      return 0;
    });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', display: 'flex', gap: '16px' }}>
      <aside
        style={{
          width: '250px',
          padding: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          alignSelf: 'flex-start',
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
                padding: '10px', border: '2px solid #ff6200', borderRadius: '25px', width: '100px',
                fontSize: '15px', color: '#333', outline: 'none', textAlign: 'center',
                backgroundColor: '#fff', transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            />
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              min={filters.minPrice}
              style={{
                padding: '10px', border: '2px solid #ff6200', borderRadius: '25px', width: '100px',
                fontSize: '15px', color: '#333', outline: 'none', textAlign: 'center',
                backgroundColor: '#fff', transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            />
          </div>
          <div style={{ marginTop: '8px' }}>
            <Slider
              range
              min={0}
              max={Math.max(...products.map(p => p.price), 1000)}
              value={[filters.minPrice, filters.maxPrice]}
              onChange={(value) => {
                const arr = value as number[];
                setFilters(prev => ({ ...prev, minPrice: arr[0], maxPrice: arr[1] }));
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
            {['inStockOnly', 'fiveStarOnly', 'fourStarAndAbove'].map(filterName => (
                <label key={filterName}>
              <input
                type="checkbox"
                        name={filterName}
                        checked={filters[filterName as keyof typeof filters] as boolean}
                onChange={handleFilterChange}
                        style={{ display: 'none' }}
                    />
                    <div style={{
                        padding: '10px 16px', borderRadius: '10px', fontWeight: 600,
                        textAlign: 'center', transition: 'all 0.2s ease-in-out', cursor: 'pointer',
                        ...(filters[filterName as keyof typeof filters]
                        ? { backgroundColor: '#ff6200', color: '#fff', border: '2px solid #ff6200' }
                        : { backgroundColor: '#fff', color: '#333', border: '2px solid #ddd' })
                    }}>
                        {filterName === 'inStockOnly' && 'Только в наличии'}
                        {filterName === 'fiveStarOnly' && 'Только 5 звёзд'}
                        {filterName === 'fourStarAndAbove' && '4 звезды и выше'}
            </div>
          </label>
            ))}
        </div>
      </aside>

      <main style={{ flexGrow: '1' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '24px' }}>
              <select
                value={sortOrder}
                onChange={handleSortChange}
                style={{
              padding: '12px 24px', border: '2px solid #ff6200', borderRadius: '25px',
              backgroundColor: '#fff', fontSize: '15px', color: '#333',
              cursor: 'pointer', fontWeight: 600, outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
              >
                <option value="default">Сортировать</option>
                <option value="asc">По возрастанию цены</option>
                <option value="desc">По убыванию цены</option>
              </select>
            </div>

        {filteredProducts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
            {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : !loadingMore && (
          <p style={{ textAlign: 'center', fontSize: '18px', color: '#333333', marginTop: '40px' }}>
              Товары не найдены.
            </p>
          )}
        
        {loadingMore && <p style={{ textAlign: 'center', marginTop: '20px' }}>Загрузка...</p>}
          <div ref={observerTarget} style={{ height: '20px' }} />
      </main>
    </div>
  );
}