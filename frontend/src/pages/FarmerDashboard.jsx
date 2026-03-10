// pages/FarmerDashboard.jsx
import React from 'react';
import { useUser } from '@clerk/clerk-react';
import WeatherWidget from '../components/weather/WeatherWidget';
import './Dashboard.css';

const FarmerDashboard = () => {
  const { user } = useUser();

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Farmer Dashboard</h1>
      <p className="dashboard-welcome">Welcome back, {user?.firstName}!</p>
      
      <div className="dashboard-grid">
        <WeatherWidget />
        {/* Add more farmer-specific widgets here */}
      </div>
    </div>
  );
};

export default FarmerDashboard;