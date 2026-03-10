import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './OrderHistory.css';

const OrderHistory = ({ onClose }) => {
  const { getToken } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content order-history">
        <div className="modal-header">
          <h2>Order History</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : orders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                  <span className="order-status">{order.status}</span>
                  <span className="order-total">₹{order.total_amount}</span>
                </div>
                <div className="order-items">
                  {order.order_items.map(item => (
                    <div key={item.id} className="order-item">
                      {item.products?.image_url && <img src={item.products.image_url} alt={item.products.name} />}
                      <div>
                        <p>{item.products?.name} x {item.quantity}</p>
                        <p>₹{item.price_at_time} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;