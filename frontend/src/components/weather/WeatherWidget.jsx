// components/weather/WeatherWidget.jsx
import React, { useState } from 'react';
import { useWeather } from '../../hooks/useWeather';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Globe, Search, X } from 'lucide-react';
import './WeatherWidget.css';

const WeatherWidget = () => {
  const { weatherData, loading, error, locationMethod, searchLocation } = useWeather('auto');
  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const getLocationIcon = () => {
    switch(locationMethod) {
      case 'live': return <Navigation size={14} className="location-icon live" />;
      case 'ip': return <Globe size={14} className="location-icon ip" />;
      case 'search': return <Search size={14} className="location-icon search" />;
      default: return <MapPin size={14} className="location-icon" />;
    }
  };

  const getLocationText = () => {
    switch(locationMethod) {
      case 'live': return 'Live GPS';
      case 'ip': return 'IP Based';
      case 'search': return 'Searched';
      default: return 'Detecting';
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      searchLocation(searchInput.trim());
      setShowSearch(false);
      setSearchInput('');
    }
  };

  if (loading) {
    return (
      <div className="weather-widget-loading">
        <div className="loading-spinner"></div>
        <p>Getting your weather...</p>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="weather-widget-error">
        <p>⚠️ Weather unavailable</p>
        <button 
          className="retry-btn"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  const { location, current } = weatherData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="weather-widget-container"
    >
      <Link to="/weather" className="weather-widget-link">
        <div className="weather-widget">
          <div className="weather-widget-header">
            <div className="location-badge">
              {getLocationIcon()}
              <span className="location-method">{getLocationText()}</span>
            </div>
            <button 
              className="search-toggle"
              onClick={(e) => {
                e.preventDefault();
                setShowSearch(!showSearch);
              }}
            >
              <Search size={14} />
            </button>
          </div>

          <AnimatePresence>
            {showSearch && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="search-form"
                onSubmit={handleSearch}
                onClick={(e) => e.preventDefault()}
              >
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter city name..."
                  className="search-input"
                  autoFocus
                />
                <button type="submit" className="search-submit">Go</button>
                <button 
                  type="button" 
                  className="search-close"
                  onClick={() => setShowSearch(false)}
                >
                  <X size={14} />
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="weather-widget-content">
            <div>
              <div className="location-container">
                <MapPin size={16} className="location-pin" />
                <p className="weather-location">
                  {location.name}, {location.country}
                </p>
              </div>
              <p className="weather-temperature">{Math.round(current.temp_c)}°C</p>
              <p className="weather-condition">{current.condition.text}</p>
            </div>
            <div className="weather-icon">
              <img 
                src={current.condition.icon} 
                alt={current.condition.text}
                onError={(e) => {
                  e.target.src = 'https://openweathermap.org/img/wn/02d@2x.png';
                }}
              />
            </div>
          </div>

          <div className="weather-details">
            <div className="weather-detail">
              <span>Humidity</span>
              <span className="weather-detail-value">{current.humidity}%</span>
            </div>
            <div className="weather-detail">
              <span>Wind</span>
              <span className="weather-detail-value">{Math.round(current.wind_kph)} km/h</span>
            </div>
            <div className="weather-detail">
              <span>Rain</span>
              <span className="weather-detail-value">{current.precip_mm || 0} mm</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default WeatherWidget;