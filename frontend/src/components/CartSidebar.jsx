import React from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '@clerk/clerk-react';
import './CartSidebar.css';

const CartSidebar = ({ onClose }) => {
  const { items, removeItem, updateQuantity, clearCart, totalPrice, totalItems } = useCart();
  const { getToken } = useAuth();
  const [placing, setPlacing] = useState(false);

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const token = await getToken();
      const orderItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: item.price
      }));
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items: orderItems, totalAmount: totalPrice })
      });
      const data = await res.json();
      if (data.success) {
        clearCart();
        alert('Order placed successfully!');
        onClose();
      } else {
        alert('Error placing order: ' + data.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="cart-sidebar">
      <div className="cart-header">
        <h2>Your Cart ({totalItems} items)</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="cart-items">
        {items.length === 0 ? (
          <p>Cart is empty</p>
        ) : (
          items.map(item => (
            <div key={item.productId} className="cart-item">
              {item.image && <img src={item.image} alt={item.name} />}
              <div className="item-details">
                <h4>{item.name}</h4>
                <p>₹{item.price} each</p>
                <div className="item-quantity">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                </div>
                <p>Subtotal: ₹{(item.price * item.quantity).toFixed(2)}</p>
              </div>
              <button className="remove-btn" onClick={() => removeItem(item.productId)}>Remove</button>
            </div>
          ))
        )}
      </div>
      {items.length > 0 && (
        <div className="cart-footer">
          <p>Total: ₹{totalPrice.toFixed(2)}</p>
          <button className="place-order" onClick={handlePlaceOrder} disabled={placing}>
            {placing ? 'Placing...' : 'Place Order'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CartSidebar;