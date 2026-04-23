// pages/Marketplace.jsx
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './Marketplace.css';

export default function Marketplace() {
  const { t } = useLanguage();
  const location = useLocation();

  return (
    <div className="marketplace">
      <h1 className="marketplace-title">{t('marketplace_title')}</h1>
      <div className="marketplace-tabs">
        <Link to="/marketplace/buy" className={`tab ${location.pathname.includes('/buy') ? 'active' : ''}`}>
          {t('buy_products')}
        </Link>
        <Link to="/marketplace/sell" className={`tab ${location.pathname.includes('/sell') ? 'active' : ''}`}>
          {t('sell_products')}
        </Link>
        <Link to="/marketplace/store" className={`tab ${location.pathname.includes('/store') ? 'active' : ''}`}>
          {t('fertilizer_tools')}
        </Link>
      </div>
      <div className="marketplace-content">
        <Outlet />
      </div>
    </div>
  );
}