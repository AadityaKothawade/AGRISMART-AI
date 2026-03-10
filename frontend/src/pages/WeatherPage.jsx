// pages/WeatherPage.jsx
import React, { useState, useEffect } from 'react';
import { useWeather } from '../hooks/useWeather';
import WeatherChart from '../components/weather/WeatherChart';
import FarmingRecommendations from '../components/weather/FarmingRecommendations';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaMapMarkerAlt, 
  FaSearch, 
  FaThermometerHalf, 
  FaTint, 
  FaWind, 
  FaCloudRain,
  FaSun,
  FaCloud,
  FaCloudSun,
  FaCloudMoon,
  FaCloudShowersHeavy,
  FaSnowflake,
  FaBolt,
  FaSmog,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaChartLine,
  FaLeaf,
  FaWater
} from 'react-icons/fa';
import './WeatherPage.css';

const WeatherPage = () => {
  const [location, setLocation] = useState('auto');
  const [searchInput, setSearchInput] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'detailed'
  const { weatherData, forecast, recommendations, loading, error, locationMethod } = useWeather(location);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setLocation(searchInput);
      setSearchInput('');
    }
  };

  const getWeatherIcon = (condition, isDay = true) => {
    const iconMap = {
      'clear': isDay ? <FaSun /> : <FaCloudMoon />,
      'sunny': <FaSun />,
      'cloud': <FaCloud />,
      'partly cloudy': <FaCloudSun />,
      'overcast': <FaCloud />,
      'rain': <FaCloudShowersHeavy />,
      'showers': <FaCloudShowersHeavy />,
      'thunder': <FaBolt />,
      'snow': <FaSnowflake />,
      'mist': <FaSmog />,
      'fog': <FaSmog />
    };

    const conditionLower = condition.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (conditionLower.includes(key)) {
        return icon;
      }
    }
    return <FaCloudSun />;
  };

  const getWeatherAdvice = (day) => {
    const advice = [];
    const temp = day.day.avgtemp_c;
    const rain = day.day.totalprecip_mm;
    const wind = day.day.maxwind_kph;
    const humidity = day.day.avghumidity;

    if (temp > 30) {
      advice.push({ type: 'warning', text: 'High temperature - ensure adequate irrigation' });
    } else if (temp < 10) {
      advice.push({ type: 'warning', text: 'Low temperature - protect sensitive crops' });
    }

    if (rain > 10) {
      advice.push({ type: 'info', text: 'Heavy rainfall expected - ensure proper drainage' });
    } else if (rain === 0) {
      advice.push({ type: 'info', text: 'No rain - plan irrigation accordingly' });
    }

    if (wind > 30) {
      advice.push({ type: 'warning', text: 'Strong winds - secure structures and avoid spraying' });
    }

    if (humidity > 80) {
      advice.push({ type: 'info', text: 'High humidity - watch for fungal diseases' });
    }

    return advice;
  };

  const getDayDetails = (day) => {
    return {
      sunrise: day.astro?.sunrise || 'N/A',
      sunset: day.astro?.sunset || 'N/A',
      moonPhase: day.astro?.moon_phase || 'N/A',
      uvIndex: day.day?.uv || 0,
      chanceOfRain: day.day?.daily_chance_of_rain || 0,
      chanceOfSnow: day.day?.daily_chance_of_snow || 0
    };
  };

  if (loading) {
    return (
      <div className="weather-page">
        <div className="loading-container">
          <div className="loading-spinner-large"></div>
          <p className="loading-text">Fetching weather data for your location...</p>
          <div className="loading-skeleton">
            <div className="skeleton-title"></div>
            <div className="skeleton-chart"></div>
            <div className="skeleton-grid">
              {[1,2,3,4,5,6,7].map(i => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-page">
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <h2 className="error-title">Oops! Weather Data Unavailable</h2>
          <p className="error-message">{error}</p>
          <button 
            className="error-retry"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="weather-page"
    >
      <div className="weather-container">
        {/* Header Section */}
        <div className="weather-header">
          <div className="header-left">
            <h1 className="page-title">
              <FaCalendarAlt className="title-icon" />
              Weather Forecast
            </h1>
            <p className="page-subtitle">7-day detailed weather analysis for your farm</p>
          </div>
          
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search city or zip code..."
              className="search-input"
            />
            <button type="submit" className="search-button">
              <FaSearch />
            </button>
          </form>
        </div>

        {/* Location Badge */}
        <div className="location-badge-large">
          <FaMapMarkerAlt className="location-icon-large" />
          <span className="location-text">
            {weatherData?.location?.name}, {weatherData?.location?.country}
          </span>
          <span className="location-method-large">
            {locationMethod === 'live' ? '📍 Live Location' : 
             locationMethod === 'ip' ? '🌐 IP Based' : '🔍 Searched'}
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'daily' ? 'active' : ''}`}
            onClick={() => setViewMode('daily')}
          >
            Daily View
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'detailed' ? 'active' : ''}`}
            onClick={() => setViewMode('detailed')}
          >
            Detailed Analysis
          </button>
        </div>

        {weatherData && forecast && (
          <>
            {/* Current Weather Card */}
            <motion.div 
              className="current-weather-card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="current-weather-main">
                <div className="current-temp">
                  <div className="temp-icon">
                    {getWeatherIcon(weatherData.current.condition.text, true)}
                  </div>
                  <div className="temp-info">
                    <span className="temp-value">{Math.round(weatherData.current.temp_c)}°</span>
                    <span className="temp-unit">C</span>
                    <p className="feels-like">Feels like {Math.round(weatherData.current.feelslike_c)}°C</p>
                  </div>
                </div>
                <div className="current-condition">
                  <p className="condition-text">{weatherData.current.condition.text}</p>
                  <p className="last-updated">
                    Updated: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="current-stats">
                <div className="stat-item">
                  <FaTint className="stat-icon humidity" />
                  <div className="stat-info">
                    <span className="stat-label">Humidity</span>
                    <span className="stat-value">{weatherData.current.humidity}%</span>
                  </div>
                </div>
                <div className="stat-item">
                  <FaWind className="stat-icon wind" />
                  <div className="stat-info">
                    <span className="stat-label">Wind Speed</span>
                    <span className="stat-value">{Math.round(weatherData.current.wind_kph)} km/h</span>
                  </div>
                </div>
                <div className="stat-item">
                  <FaCloudRain className="stat-icon rain" />
                  <div className="stat-info">
                    <span className="stat-label">Rainfall</span>
                    <span className="stat-value">{weatherData.current.precip_mm || 0} mm</span>
                  </div>
                </div>
                <div className="stat-item">
                  <FaThermometerHalf className="stat-icon pressure" />
                  <div className="stat-info">
                    <span className="stat-label">Pressure</span>
                    <span className="stat-value">{weatherData.current.pressure_mb || 1013} mb</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Charts Section */}
            <motion.div 
              className="charts-section"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <WeatherChart forecastData={forecast} />
            </motion.div>

            {/* Farming Recommendations */}
            <motion.div 
              className="recommendations-section"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="section-title-with-icon">
                <FaLeaf className="section-icon" />
                Smart Farming Recommendations
              </h2>
              <FarmingRecommendations recommendations={recommendations} />
            </motion.div>

            {/* 7-Day Forecast */}
            <motion.div 
              className="forecast-section"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="section-title-with-icon">
                <FaCalendarAlt className="section-icon" />
                7-Day Weather Forecast
              </h2>

              <AnimatePresence mode="wait">
                {viewMode === 'daily' ? (
                  <motion.div 
                    key="daily"
                    className="forecast-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {forecast.forecast.forecastday.map((day, index) => {
                      const details = getDayDetails(day);
                      return (
                        <motion.div
                          key={day.date}
                          className={`forecast-card ${selectedDay === index ? 'selected' : ''}`}
                          onClick={() => setSelectedDay(selectedDay === index ? null : index)}
                          whileHover={{ y: -5 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="forecast-date">
                            <p className="day-name">
                              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </p>
                            <p className="full-date">
                              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          
                          <div className="forecast-icon-large">
                            {getWeatherIcon(day.day.condition.text)}
                          </div>
                          
                          <div className="forecast-temps">
                            <span className="max-temp">{Math.round(day.day.maxtemp_c)}°</span>
                            <span className="min-temp">{Math.round(day.day.mintemp_c)}°</span>
                          </div>
                          
                          <div className="forecast-stats">
                            <div className="forecast-stat" title="Rainfall">
                              <FaCloudRain className="stat-icon-small rain" />
                              <span>{day.day.totalprecip_mm}mm</span>
                            </div>
                            <div className="forecast-stat" title="Humidity">
                              <FaTint className="stat-icon-small humidity" />
                              <span>{day.day.avghumidity}%</span>
                            </div>
                            <div className="forecast-stat" title="Wind">
                              <FaWind className="stat-icon-small wind" />
                              <span>{Math.round(day.day.maxwind_kph)} km/h</span>
                            </div>
                          </div>

                          <div className="forecast-condition">
                            {day.day.condition.text}
                          </div>

                          <AnimatePresence>
                            {selectedDay === index && (
                              <motion.div 
                                className="day-details"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                <div className="details-grid">
                                  <div className="detail-item">
                                    <span className="detail-label">Sunrise</span>
                                    <span className="detail-value">{details.sunrise}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Sunset</span>
                                    <span className="detail-value">{details.sunset}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">UV Index</span>
                                    <span className="detail-value">{details.uvIndex}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Moon Phase</span>
                                    <span className="detail-value">{details.moonPhase}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Rain Chance</span>
                                    <span className="detail-value">{details.chanceOfRain}%</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Snow Chance</span>
                                    <span className="detail-value">{details.chanceOfSnow}%</span>
                                  </div>
                                </div>

                                <div className="day-advice">
                                  <h4>Farming Advice for this Day:</h4>
                                  <ul>
                                    {getWeatherAdvice(day).map((advice, i) => (
                                      <li key={i} className={`advice-${advice.type}`}>
                                        {advice.text}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="detailed"
                    className="detailed-analysis"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="analysis-header">
                      <FaChartLine className="analysis-icon" />
                      <h3>Weekly Weather Analysis</h3>
                    </div>
                    
                    <div className="analysis-grid">
                      <div className="analysis-card">
                        <h4>Temperature Trends</h4>
                        <div className="trend-stats">
                          <div className="trend-item">
                            <span>Average High</span>
                            <strong>
                              {Math.round(forecast.forecast.forecastday.reduce((acc, day) => 
                                acc + day.day.maxtemp_c, 0) / 7)}°C
                            </strong>
                          </div>
                          <div className="trend-item">
                            <span>Average Low</span>
                            <strong>
                              {Math.round(forecast.forecast.forecastday.reduce((acc, day) => 
                                acc + day.day.mintemp_c, 0) / 7)}°C
                            </strong>
                          </div>
                          <div className="trend-item">
                            <span>Temperature Range</span>
                            <strong>
                              {Math.round(Math.max(...forecast.forecast.forecastday.map(d => d.day.maxtemp_c)))}° / 
                              {Math.round(Math.min(...forecast.forecast.forecastday.map(d => d.day.mintemp_c)))}°
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="analysis-card">
                        <h4>Rainfall Summary</h4>
                        <div className="trend-stats">
                          <div className="trend-item">
                            <span>Total Rainfall</span>
                            <strong>
                              {forecast.forecast.forecastday.reduce((acc, day) => 
                                acc + day.day.totalprecip_mm, 0).toFixed(1)} mm
                            </strong>
                          </div>
                          <div className="trend-item">
                            <span>Rainy Days</span>
                            <strong>
                              {forecast.forecast.forecastday.filter(day => 
                                day.day.totalprecip_mm > 0.1).length} days
                            </strong>
                          </div>
                          <div className="trend-item">
                            <span>Max Rainfall</span>
                            <strong>
                              {Math.max(...forecast.forecast.forecastday.map(d => d.day.totalprecip_mm)).toFixed(1)} mm
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="analysis-card">
                        <h4>Wind & Humidity</h4>
                        <div className="trend-stats">
                          <div className="trend-item">
                            <span>Avg Wind Speed</span>
                            <strong>
                              {Math.round(forecast.forecast.forecastday.reduce((acc, day) => 
                                acc + day.day.maxwind_kph, 0) / 7)} km/h
                            </strong>
                          </div>
                          <div className="trend-item">
                            <span>Avg Humidity</span>
                            <strong>
                              {Math.round(forecast.forecast.forecastday.reduce((acc, day) => 
                                acc + day.day.avghumidity, 0) / 7)}%
                            </strong>
                          </div>
                          <div className="trend-item">
                            <span>UV Index Range</span>
                            <strong>
                              {Math.min(...forecast.forecast.forecastday.map(d => d.day.uv))} - 
                              {Math.max(...forecast.forecast.forecastday.map(d => d.day.uv))}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="farming-calendar">
                      <h4>Recommended Activities This Week</h4>
                      <div className="calendar-grid">
                        {forecast.forecast.forecastday.map((day, index) => (
                          <div key={day.date} className="calendar-day">
                            <div className="calendar-date">
                              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div className="calendar-weather">
                              {getWeatherIcon(day.day.condition.text)}
                            </div>
                            <div className="calendar-activities">
                              {day.day.totalprecip_mm > 5 ? (
                                <span className="activity">🚫 Avoid spraying</span>
                              ) : day.day.avgtemp_c > 25 ? (
                                <span className="activity">💧 Irrigation needed</span>
                              ) : day.day.avgtemp_c < 10 ? (
                                <span className="activity">❄️ Frost protection</span>
                              ) : (
                                <span className="activity">✅ Good for planting</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default WeatherPage;