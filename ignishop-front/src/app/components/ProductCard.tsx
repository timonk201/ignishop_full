import React from 'react';
import { useRouter } from 'next/navigation';

export interface ProductCardProps {
  product: {
    id: number;
    name: string;
    category: { name: string };
    subcategory?: { name: string } | null;
    description: string;
    price: number;
    image?: string;
    average_rating?: number;
    total_reviews?: number;
  };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const router = useRouter();
  const showRating =
    typeof product.average_rating === 'number' &&
    typeof product.total_reviews === 'number' &&
    product.total_reviews > 0 &&
    product.average_rating > 0;

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        cursor: 'pointer',
        width: '260px',
        height: '370px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'transform 0.2s',
      }}
      onClick={() => router.push(`/product/${product.id}`)}
      onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.05)')}
      onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {product.image ? (
        <img
          src={product.image.startsWith('http')
            ? product.image
            : (product.image.startsWith('/storage/')
              ? `http://localhost:8000${product.image}`
              : `http://localhost:8000/storage/${product.image}`)}
          alt={product.name}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            borderRadius: '14px 14px 0 0',
            background: '#f8f8f8',
          }}
        />
      ) : (
        <div style={{ width: '100%', height: '200px', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#888' }}>{product.name}</div>
      )}
      <div style={{ padding: '18px', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#222', margin: '0 0 6px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</h4>
        <p style={{ fontSize: '15px', color: '#666', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.category.name}{product.subcategory ? ` / ${product.subcategory.name}` : ''}</p>
        <p style={{ fontSize: '14px', color: '#444', margin: '8px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.description}</p>
        {showRating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 0 0' }}>
            <span style={{ color: '#FF6200', fontWeight: 700, fontSize: '16px' }}>★ {product.average_rating.toFixed(1)}</span>
            <span style={{ color: '#888', fontSize: '14px' }}>({product.total_reviews})</span>
          </div>
        )}
        <p style={{ fontSize: '18px', color: '#FF6200', fontWeight: 700, margin: '12px 0 0 0' }}>{product.price} $</p>
      </div>
    </div>
  );
};

export default ProductCard; 