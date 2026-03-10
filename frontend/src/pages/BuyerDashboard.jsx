// pages/BuyerDashboard.jsx
import React from 'react';
import { useUser } from '@clerk/clerk-react';
import './Dashboard.css';

const BuyerDashboard = () => {
  const { user } = useUser();

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Buyer Dashboard</h1>
      <p className="dashboard-welcome">Welcome back, {user?.firstName}!</p>
      
      <div className="dashboard-grid">
        {/* Add buyer-specific widgets here */}
      </div>
    </div>
  );
};

export default BuyerDashboard;