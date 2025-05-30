// app/components/SearchBar.tsx
'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', maxWidth: '400px' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск товаров..."
        style={{
          flexGrow: 1,
          padding: '8px',
          border: 'none',
          borderRadius: '20px 0 0 20px',
          outline: 'none',
          boxShadow: '0 0 0 2px #ff6200 inset',
        }}
      />
      <button
        type="submit"
        style={{
          backgroundColor: '#ff6200',
          color: 'white',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '0 20px 20px 0',
          cursor: 'pointer',
        }}
      >
        Найти
      </button>
    </form>
  );
}