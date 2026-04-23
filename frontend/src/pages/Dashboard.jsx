// pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import './Dashboard.css';

export default function Dashboard() {
  const { t } = useLanguage();
  const { getToken } = useAuth();
  const [stats, setStats] = useState({ totalProducts: 0, ordersReceived: 0, recentSchemes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [productsRes, ordersRes, schemesRes] = await Promise.all([
          fetch('/api/products/my-products', { headers }),
          fetch('/api/orders/received', { headers }),
          fetch('/api/schemes')
        ]);
        const products = await productsRes.json();
        const orders = await ordersRes.json();
        const schemes = await schemesRes.json();
        setStats({
          totalProducts: products.data?.length || 0,
          ordersReceived: orders.data?.length || 0,
          recentSchemes: schemes.data?.slice(0, 3) || []
        });
      } catch (error) { console.error('Dashboard fetch error:', error); }
      finally { setLoading(false); }
    };
    fetchDashboardData();
  }, [getToken]);

  if (loading) return <div className="loading">{t('loading_dashboard')}</div>;

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">{t('farmer_dashboard')}</h1>
      <div className="stats-grid">
        <motion.div className="stat-card" whileHover={{ y: -5 }}>
          <h3>{t('total_products_listed')}</h3>
          <p className="stat-number">{stats.totalProducts}</p>
          <Link to="/sell" className="stat-link">{t('manage_products')}</Link>
        </motion.div>
        <motion.div className="stat-card" whileHover={{ y: -5 }}>
          <h3>{t('orders_received')}</h3>
          <p className="stat-number">{stats.ordersReceived}</p>
          <Link to="/my-orders" className="stat-link">{t('view_orders')}</Link>
        </motion.div>
        <motion.div className="stat-card" whileHover={{ y: -5 }}>
          <h3>{t('government_schemes')}</h3>
          <div className="scheme-preview">
            {stats.recentSchemes.map(scheme => (
              <div key={scheme.id} className="scheme-item">
                <span className="scheme-name">{scheme.scheme_name}</span>
                <span className="scheme-date">by {scheme.last_date}</span>
              </div>
            ))}
          </div>
          <Link to="/schemes" className="stat-link">{t('view_all_schemes')}</Link>
        </motion.div>
      </div>
    </div>
  );
}