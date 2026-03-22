import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import './BuyProduct.css';

const categories = ['all', 'vegetables', 'grains', 'fruits', 'fertilizers', 'seeds', 'tools', 'pesticides'];

export default function BuyProduct() {
  const { getToken, userId } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, searchTerm]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.data || []);
    } catch (error) {
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  };

  const handleBuy = async (product) => {
    const quantity = prompt('Enter quantity:', product.quantity);
    if (!quantity) return;

    try {
      const token = await getToken();
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: product.id, quantity: parseFloat(quantity) })
      });

      if (res.ok) {
        alert('Purchase request sent!');
      } else {
        const error = await res.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Order error:', error);
    }
  };

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div className="buy-product">
      <div className="filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="category-filter">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.length === 0 && <p>No products found.</p>}
        {filteredProducts.map(product => (
          <motion.div
            key={product.id}
            className="product-card"
            whileHover={{ y: -5 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {product.image_url && (
              <img src={product.image_url} alt={product.product_name} className="product-image" />
            )}
            <div className="product-details">
              <h3>{product.product_name}</h3>
              <p className="category">{product.category}</p>
              <p className="price">₹{product.price} / {product.quantity}</p>
              <p className="location">{product.location}</p>
              <p className="description">{product.description}</p>
              <p className="seller">Seller: {product.clerk_id}</p>
              <button
                className="buy-btn"
                onClick={() => handleBuy(product)}
                disabled={product.clerk_id === userId}
              >
                {product.clerk_id === userId ? 'Your product' : 'Buy Now'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}