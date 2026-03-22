import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import './Marketplace.css';

export default function Marketplace() {
  const location = useLocation();

  return (
    <div className="marketplace">
      <h1 className="marketplace-title">Marketplace</h1>
      <div className="marketplace-tabs">
        <Link
          to="/marketplace/buy"
          className={`tab ${location.pathname.includes('/buy') ? 'active' : ''}`}
        >
          Buy Products
        </Link>
        <Link
          to="/marketplace/sell"
          className={`tab ${location.pathname.includes('/sell') ? 'active' : ''}`}
        >
          Sell Products
        </Link>
        <Link
          to="/marketplace/store"
          className={`tab ${location.pathname.includes('/store') ? 'active' : ''}`}
        >
          Fertilizer & Tools
        </Link>
      </div>
      <div className="marketplace-content">
        <Outlet />
      </div>
    </div>
  );
}