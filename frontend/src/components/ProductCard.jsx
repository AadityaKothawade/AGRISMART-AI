import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="product-card">
      {product.image_url && <img src={product.image_url} alt={product.name} />}
      <h3>{product.name}</h3>
      <p className="price">₹{product.price}</p>
      <p className="quantity">Available: {product.quantity}</p>
      <p className="category">{product.category}</p>
      <p className="location">{product.location}</p>
      <p className="farmer">Sold by: {product.users?.first_name} {product.users?.last_name}</p>
      
      <div className="add-to-cart">
        <input
          type="number"
          min="1"
          max={product.quantity}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
        />
        <button onClick={handleAddToCart} disabled={product.quantity === 0}>
          {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
      {added && <span className="added-message">Added to cart!</span>}
    </div>
  );
};

export default ProductCard;