// pages/MyOrders.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import './MyOrders.css';

export default function MyOrders() {
  const { t } = useLanguage();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('buying');
  const [buyingOrders, setBuyingOrders] = useState([]);
  const [sellingOrders, setSellingOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [buyingRes, sellingRes] = await Promise.all([
        fetch('/api/orders/my-orders', { headers }),
        fetch('/api/orders/received', { headers })
      ]);
      const buyingData = await buyingRes.json();
      const sellingData = await sellingRes.json();
      setBuyingOrders(buyingData.data || []);
      setSellingOrders(sellingData.data || []);
    } catch (error) { console.error('Fetch orders error:', error); }
    finally { setLoading(false); }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchOrders();
      else alert(t('status_update_failed'));
    } catch (error) { console.error('Update error:', error); }
  };

  if (loading) return <div className="loading">{t('loading_orders')}</div>;
  const orders = activeTab === 'buying' ? buyingOrders : sellingOrders;

  const statusText = { pending: t('pending'), accepted: t('accepted'), rejected: t('rejected') };

  return (
    <div className="my-orders">
      <h1 className="orders-title">{t('my_orders_title')}</h1>
      <div className="orders-tabs">
        <button className={`tab ${activeTab === 'buying' ? 'active' : ''}`} onClick={() => setActiveTab('buying')}>{t('buying')}</button>
        <button className={`tab ${activeTab === 'selling' ? 'active' : ''}`} onClick={() => setActiveTab('selling')}>{t('selling')}</button>
      </div>
      <div className="orders-list">
        {orders.length === 0 && <p>{t('no_orders')}</p>}
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-product">
              <h3>{order.products?.product_name}</h3>
              <p className="order-quantity">{t('quantity')}: {order.quantity}</p>
              <p className="order-status">{t('placed')}: <span className={`status-${order.status}`}>{statusText[order.status] || order.status}</span></p>
              <p className="order-date">{t('placed')}: {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            {activeTab === 'selling' && order.status === 'pending' && (
              <div className="order-actions">
                <button className="accept-btn" onClick={() => handleStatusUpdate(order.id, 'accepted')}>{t('accept_btn')}</button>
                <button className="reject-btn" onClick={() => handleStatusUpdate(order.id, 'rejected')}>{t('reject_btn')}</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}