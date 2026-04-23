// pages/WeatherPage.jsx
import React, { useState } from 'react';
import { useWeather } from '../hooks/useWeather';
import WeatherChart from '../components/weather/WeatherChart';
import FarmingRecommendations from '../components/weather/FarmingRecommendations';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaMapMarkerAlt, FaSearch, FaThermometerHalf, FaTint, FaWind, FaCloudRain,
  FaSun, FaCloud, FaCloudSun, FaCloudMoon, FaCloudShowersHeavy, FaSnowflake,
  FaBolt, FaSmog, FaExclamationTriangle, FaCalendarAlt, FaChartLine, FaLeaf
} from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import './WeatherPage.css';

const WeatherPage = () => {
  const { t } = useLanguage();
  const [location, setLocation] = useState('auto');
  const [searchInput, setSearchInput] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState('daily');
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
      if (conditionLower.includes(key)) return icon;
    }
    return <FaCloudSun />;
  };

  const getWeatherAdvice = (day) => {
    const advice = [];
    const temp = day.day.avgtemp_c;
    const rain = day.day.totalprecip_mm;
    const wind = day.day.maxwind_kph;
    const humidity = day.day.avghumidity;

    if (temp > 30) advice.push({ type: 'warning', text: t('high_temp_advice') });
    else if (temp < 10) advice.push({ type: 'warning', text: t('low_temp_advice') });

    if (rain > 10) advice.push({ type: 'info', text: t('heavy_rain_advice') });
    else if (rain === 0) advice.push({ type: 'info', text: t('no_rain_advice') });

    if (wind > 30) advice.push({ type: 'warning', text: t('strong_wind_advice') });
    if (humidity > 80) advice.push({ type: 'info', text: t('high_humidity_advice') });

    return advice;
  };

  const getDayDetails = (day) => ({
    sunrise: day.astro?.sunrise || 'N/A',
    sunset: day.astro?.sunset || 'N/A',
    moonPhase: day.astro?.moon_phase || 'N/A',
    uvIndex: day.day?.uv || 0,
    chanceOfRain: day.day?.daily_chance_of_rain || 0,
    chanceOfSnow: day.day?.daily_chance_of_snow || 0
  });

  if (loading) {
    return (
      <div className="weather-page">
        <div className="loading-container">
          <div className="loading-spinner-large"></div>
          <p className="loading-text">{t('fetching_weather')}</p>
          <div className="loading-skeleton">
            <div className="skeleton-title"></div>
            <div className="skeleton-chart"></div>
            <div className="skeleton-grid">
              {[1,2,3,4,5,6,7].map(i => <div key={i} className="skeleton-card"></div>)}
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
          <h2 className="error-title">{t('weather_unavailable')}</h2>
          <p className="error-message">{error}</p>
          <button className="error-retry" onClick={() => window.location.reload()}>
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="weather-page">
      <div className="weather-container">
        {/* Header */}
        <div className="weather-header">
          <div className="header-left">
            <h1 className="page-title">
              <FaCalendarAlt className="title-icon" />
              {t('weather_forecast')}
            </h1>
            <p className="page-subtitle">{t('weather_subtitle')}</p>
          </div>
          <form onSubmit={handleSearch} className="search-form">
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={t('search_city')} className="search-input" />
            <button type="submit" className="search-button"><FaSearch /></button>
          </form>
        </div>

        {/* Location Badge */}
        <div className="location-badge-large">
          <FaMapMarkerAlt className="location-icon-large" />
          <span className="location-text">{weatherData?.location?.name}, {weatherData?.location?.country}</span>
          <span className="location-method-large">
            {locationMethod === 'live' ? `📍 ${t('live_location')}` : locationMethod === 'ip' ? `🌐 ${t('ip_based')}` : `🔍 ${t('searched')}`}
          </span>
        </div>

        {/* View Toggle */}
        <div className="view-toggle">
          <button className={`toggle-btn ${viewMode === 'daily' ? 'active' : ''}`} onClick={() => setViewMode('daily')}>{t('daily_view')}</button>
          <button className={`toggle-btn ${viewMode === 'detailed' ? 'active' : ''}`} onClick={() => setViewMode('detailed')}>{t('detailed_analysis')}</button>
        </div>

        {weatherData && forecast && (
          <>
            {/* Current Weather Card */}
            <motion.div className="current-weather-card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <div className="current-weather-main">
                <div className="current-temp">
                  <div className="temp-icon">{getWeatherIcon(weatherData.current.condition.text, true)}</div>
                  <div className="temp-info">
                    <span className="temp-value">{Math.round(weatherData.current.temp_c)}°</span>
                    <span className="temp-unit">C</span>
                    <p className="feels-like">{t('feels_like')} {Math.round(weatherData.current.feelslike_c)}°C</p>
                  </div>
                </div>
                <div className="current-condition">
                  <p className="condition-text">{weatherData.current.condition.text}</p>
                  <p className="last-updated">{t('updated_at')}: {new Date().toLocaleTimeString()}</p>
                </div>
              </div>

              <div className="current-stats">
                <div className="stat-item"><FaTint className="stat-icon humidity" /><div className="stat-info"><span className="stat-label">{t('humidity_short')}</span><span className="stat-value">{weatherData.current.humidity}%</span></div></div>
                <div className="stat-item"><FaWind className="stat-icon wind" /><div className="stat-info"><span className="stat-label">{t('wind_speed')}</span><span className="stat-value">{Math.round(weatherData.current.wind_kph)} km/h</span></div></div>
                <div className="stat-item"><FaCloudRain className="stat-icon rain" /><div className="stat-info"><span className="stat-label">{t('rainfall')}</span><span className="stat-value">{weatherData.current.precip_mm || 0} mm</span></div></div>
                <div className="stat-item"><FaThermometerHalf className="stat-icon pressure" /><div className="stat-info"><span className="stat-label">{t('pressure')}</span><span className="stat-value">{weatherData.current.pressure_mb || 1013} mb</span></div></div>
              </div>
            </motion.div>

            {/* Charts Section */}
            <motion.div className="charts-section" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <WeatherChart forecastData={forecast} />
            </motion.div>

            {/* Farming Recommendations */}
            <motion.div className="recommendations-section" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <h2 className="section-title-with-icon"><FaLeaf className="section-icon" />{t('smart_farming_recommendations')}</h2>
              <FarmingRecommendations recommendations={recommendations} />
            </motion.div>

            {/* 7-Day Forecast Section */}
            <motion.div className="forecast-section" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
              <h2 className="section-title-with-icon">
                <FaCalendarAlt className="section-icon" />
                {t('seven_day_forecast')}
              </h2>

              <AnimatePresence mode="wait">
                {viewMode === 'daily' ? (
                  <motion.div key="daily" className="forecast-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                            <p className="day-name">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}</p>
                            <p className="full-date">{new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                          </div>
                          <div className="forecast-icon-large">{getWeatherIcon(day.day.condition.text)}</div>
                          <div className="forecast-temps">
                            <span className="max-temp">{Math.round(day.day.maxtemp_c)}°</span>
                            <span className="min-temp">{Math.round(day.day.mintemp_c)}°</span>
                          </div>
                          <div className="forecast-stats">
                            <div className="forecast-stat" title={t('rainfall')}><FaCloudRain className="stat-icon-small rain" /><span>{day.day.totalprecip_mm}mm</span></div>
                            <div className="forecast-stat" title={t('humidity_short')}><FaTint className="stat-icon-small humidity" /><span>{day.day.avghumidity}%</span></div>
                            <div className="forecast-stat" title={t('wind_speed')}><FaWind className="stat-icon-small wind" /><span>{Math.round(day.day.maxwind_kph)} km/h</span></div>
                          </div>
                          <div className="forecast-condition">{day.day.condition.text}</div>

                          <AnimatePresence>
                            {selectedDay === index && (
                              <motion.div className="day-details" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                <div className="details-grid">
                                  <div className="detail-item"><span className="detail-label">{t('sunrise')}</span><span className="detail-value">{details.sunrise}</span></div>
                                  <div className="detail-item"><span className="detail-label">{t('sunset')}</span><span className="detail-value">{details.sunset}</span></div>
                                  <div className="detail-item"><span className="detail-label">{t('uv_index')}</span><span className="detail-value">{details.uvIndex}</span></div>
                                  <div className="detail-item"><span className="detail-label">{t('moon_phase')}</span><span className="detail-value">{details.moonPhase}</span></div>
                                  <div className="detail-item"><span className="detail-label">{t('rain_chance')}</span><span className="detail-value">{details.chanceOfRain}%</span></div>
                                  <div className="detail-item"><span className="detail-label">{t('snow_chance')}</span><span className="detail-value">{details.chanceOfSnow}%</span></div>
                                </div>
                                <div className="day-advice">
                                  <h4>{t('farming_advice_for_day')}</h4>
                                  <ul>
                                    {getWeatherAdvice(day).map((advice, i) => (
                                      <li key={i} className={`advice-${advice.type}`}>{advice.text}</li>
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
                  <motion.div key="detailed" className="detailed-analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="analysis-header">
                      <FaChartLine className="analysis-icon" />
                      <h3>{t('weekly_weather_analysis')}</h3>
                    </div>
                    <div className="analysis-grid">
                      {/* Temperature Trends */}
                      <div className="analysis-card">
                        <h4>{t('temperature_trends')}</h4>
                        <div className="trend-stats">
                          <div className="trend-item"><span>{t('average_high')}</span><strong>{Math.round(forecast.forecast.forecastday.reduce((acc, day) => acc + day.day.maxtemp_c, 0) / 7)}°C</strong></div>
                          <div className="trend-item"><span>{t('average_low')}</span><strong>{Math.round(forecast.forecast.forecastday.reduce((acc, day) => acc + day.day.mintemp_c, 0) / 7)}°C</strong></div>
                          <div className="trend-item"><span>{t('temperature_range')}</span><strong>{Math.round(Math.max(...forecast.forecast.forecastday.map(d => d.day.maxtemp_c)))}° / {Math.round(Math.min(...forecast.forecast.forecastday.map(d => d.day.mintemp_c)))}°</strong></div>
                        </div>
                      </div>
                      {/* Rainfall Summary */}
                      <div className="analysis-card">
                        <h4>{t('rainfall_summary')}</h4>
                        <div className="trend-stats">
                          <div className="trend-item"><span>{t('total_rainfall')}</span><strong>{forecast.forecast.forecastday.reduce((acc, day) => acc + day.day.totalprecip_mm, 0).toFixed(1)} mm</strong></div>
                          <div className="trend-item"><span>{t('rainy_days')}</span><strong>{forecast.forecast.forecastday.filter(day => day.day.totalprecip_mm > 0.1).length} {t('days')}</strong></div>
                          <div className="trend-item"><span>{t('max_rainfall')}</span><strong>{Math.max(...forecast.forecast.forecastday.map(d => d.day.totalprecip_mm)).toFixed(1)} mm</strong></div>
                        </div>
                      </div>
                      {/* Wind & Humidity */}
                      <div className="analysis-card">
                        <h4>{t('wind_humidity')}</h4>
                        <div className="trend-stats">
                          <div className="trend-item"><span>{t('avg_wind_speed')}</span><strong>{Math.round(forecast.forecast.forecastday.reduce((acc, day) => acc + day.day.maxwind_kph, 0) / 7)} km/h</strong></div>
                          <div className="trend-item"><span>{t('avg_humidity')}</span><strong>{Math.round(forecast.forecast.forecastday.reduce((acc, day) => acc + day.day.avghumidity, 0) / 7)}%</strong></div>
                          <div className="trend-item"><span>{t('uv_index_range')}</span><strong>{Math.min(...forecast.forecast.forecastday.map(d => d.day.uv))} - {Math.max(...forecast.forecast.forecastday.map(d => d.day.uv))}</strong></div>
                        </div>
                      </div>
                    </div>

                    <div className="farming-calendar">
                      <h4>{t('recommended_activities')}</h4>
                      <div className="calendar-grid">
                        {forecast.forecast.forecastday.map((day) => (
                          <div key={day.date} className="calendar-day">
                            <div className="calendar-date">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}</div>
                            <div className="calendar-weather">{getWeatherIcon(day.day.condition.text)}</div>
                            <div className="calendar-activities">
                              {day.day.totalprecip_mm > 5 ? (
                                <span className="activity">{t('avoid_spraying')}</span>
                              ) : day.day.avgtemp_c > 25 ? (
                                <span className="activity">{t('irrigation_needed')}</span>
                              ) : day.day.avgtemp_c < 10 ? (
                                <span className="activity">{t('frost_protection')}</span>
                              ) : (
                                <span className="activity">{t('good_for_planting')}</span>
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