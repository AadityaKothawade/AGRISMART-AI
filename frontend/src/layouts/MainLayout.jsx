// layouts/MainLayout.jsx
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import WeatherWidget from '../components/weather/WeatherWidget';
import './MainLayout.css';

const MainLayout = () => {
  const { isSignedIn, user } = useUser();
  const userRole = user?.publicMetadata?.role || 'farmer';

  return (
    <div className="main-layout">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-left">
            <Link to="/" className="logo">
              FarmManager
            </Link>
            <div className="nav-links">
              <Link to="/soybean" className="nav-link">Soybean</Link>
              <Link to="/fertilizer" className="nav-link">Fertilizer</Link>
              <Link to="/budget" className="nav-link">Budget</Link>
              <Link to="/weather" className="nav-link">Weather</Link>
              {isSignedIn && (
                <Link 
                  to={userRole === 'farmer' ? '/farmer-dashboard' : '/buyer-dashboard'} 
                  className="nav-link"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
          
          <div className="nav-right">
            <div className="weather-widget-wrapper">
              <WeatherWidget />
            </div>
            
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <div className="auth-buttons">
                <Link to="/sign-in" className="sign-in-btn">
                  Sign In
                </Link>
                <Link to="/sign-up" className="sign-up-btn">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;