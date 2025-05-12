import { Product } from "../productStore";

export async function fetchProducts() {
    const response = await fetch('http://localhost:8000/api/products', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data.data as Product[];
  }
  
  export async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    const response = await fetch('http://localhost:8000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error('Failed to create product');
    const data = await response.json();
    return data.data as Product;
  }