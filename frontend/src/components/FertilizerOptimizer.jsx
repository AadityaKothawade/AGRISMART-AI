// components/FertilizerOptimizer.jsx
import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import BudgetOptimizer from "./BudgetOptimizer";
import { useLanguage } from "../contexts/LanguageContext";
import "./FertilizerOptimizer.css";

export default function FertilizerOptimizer() {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    temperature: "",
    humidity: "",
    moisture: "",
    soil_type: "",
    nitrogen: "",
    potassium: "",
    phosphorous: "",
    previous_crop: "",
    season: "",
    ph: ""
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [locationData, setLocationData] = useState(null);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState({ city: "", country: "" });
  
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);

  const OPENWEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
  const API_BASE_URL = "http://127.0.0.1:5001";

  // Helper to force re‑translation of dynamic option labels in render
  const getSoilOptions = () => [
    { value: "Sandy", label: t('soil_sandy'), description: t('soil_sandy_desc'), npkRatio: { n: 1, p: 0.4, k: 0.3 } },
    { value: "Loamy", label: t('soil_loamy'), description: t('soil_loamy_desc'), npkRatio: { n: 1, p: 0.8, k: 0.8 } },
    { value: "Black", label: t('soil_black'), description: t('soil_black_desc'), npkRatio: { n: 1, p: 0.5, k: 1.0 } },
    { value: "Red", label: t('soil_red'), description: t('soil_red_desc'), npkRatio: { n: 1, p: 0.3, k: 0.4 } },
    { value: "Clayey", label: t('soil_clayey'), description: t('soil_clayey_desc'), npkRatio: { n: 1, p: 0.6, k: 1.2 } }
  ];

  const getSeasonOptions = () => [
    { value: "kharif", label: t('season_kharif') },
    { value: "rabi", label: t('season_rabi') },
    { value: "zaid", label: t('season_zaid') }
  ];

  const getCropOptions = () => [
    { value: "rice", label: t('crop_rice') },
    { value: "wheat", label: t('crop_wheat') },
    { value: "maize", label: t('crop_maize') },
    { value: "cotton", label: t('crop_cotton') },
    { value: "sugarcane", label: t('crop_sugarcane') },
    { value: "groundnut", label: t('crop_groundnut') },
    { value: "soyabean", label: t('crop_soyabean') }
  ];

  const estimateSoilMoisture = (humidity, temperature, rainfall = 0) => {
    const baseMoisture = humidity * 0.6;
    const rainEffect = rainfall * 2;
    const tempEffect = temperature > 30 ? -15 : (temperature < 15 ? 10 : 0);
    let moisture = baseMoisture + rainEffect + tempEffect;
    return Math.min(80, Math.max(10, moisture));
  };

  const getLocationName = async (lat, lon) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_API_KEY}`
      );
      if (response.data && response.data[0]) {
        const location = response.data[0];
        return `${location.name}, ${location.country}`;
      }
    } catch (error) { console.log("Reverse geocoding error:", error); }
    return `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
  };

  const getCoordinatesFromCity = async (city, country) => {
    try {
      setLocationStatus(t('searching_location'));
      const query = country ? `${city},${country}` : city;
      const response = await axios.get(
        `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=1&appid=${OPENWEATHER_API_KEY}`
      );
      if (response.data && response.data[0]) {
        const location = response.data[0];
        return { lat: location.lat, lon: location.lon, name: `${location.name}, ${location.country}` };
      } else throw new Error(t('location_not_found'));
    } catch (error) { throw error; }
  };

  const handleManualLocationSubmit = async (e) => {
    e.preventDefault();
    if (!manualLocation.city) {
      alert(t('enter_city_name'));
      return;
    }
    setLocationLoading(true);
    setLocationStatus(t('getting_location_data'));
    try {
      const location = await getCoordinatesFromCity(manualLocation.city, manualLocation.country);
      await fetchDataFromLocation(location.lat, location.lon, location.name);
      setShowManualLocation(false);
    } catch (error) {
      setLocationStatus(t('location_not_found'));
      alert(t('location_not_found_check'));
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchDataFromLocation = async (lat, lon, locationName = null) => {
    setLocationLoading(true);
    setLocationStatus(t('getting_location_data'));
    try {
      if (!locationName) locationName = await getLocationName(lat, lon);
      setLocationStatus(t('fetching_weather_data'));
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      const weatherData = weatherResponse.data;
      const temperature = weatherData.main.temp;
      const humidity = weatherData.main.humidity;
      const rainfall = weatherData.rain ? weatherData.rain['1h'] || weatherData.rain['3h'] || 0 : 0;
      const estimatedMoisture = estimateSoilMoisture(humidity, temperature, rainfall);
      setLocationData({ name: locationName, lat: lat.toFixed(4), lon: lon.toFixed(4) });
      setForm(prev => ({
        ...prev,
        temperature: temperature.toFixed(1),
        humidity: Math.round(humidity),
        moisture: Math.round(estimatedMoisture)
      }));
      setLocationStatus(t('weather_data_fetched', { location: locationName }));
    } catch (error) {
      let errorMessage = t('failed_fetch_weather');
      if (error.response?.status === 401) errorMessage += t('invalid_api_key');
      else if (error.response?.status === 404) errorMessage += t('location_not_found');
      else errorMessage += t('check_connection');
      setLocationStatus(errorMessage);
      alert(errorMessage);
    } finally {
      setLocationLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t('geolocation_not_supported'));
      return;
    }
    setLocationLoading(true);
    setLocationStatus(t('requesting_location'));
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchDataFromLocation(latitude, longitude);
      },
      (error) => {
        let errorMessage = t('could_not_get_location');
        switch(error.code) {
          case error.PERMISSION_DENIED: errorMessage += t('enable_location'); break;
          case error.POSITION_UNAVAILABLE: errorMessage += t('location_unavailable'); break;
          case error.TIMEOUT: errorMessage += t('location_timeout'); break;
          default: errorMessage += t('enter_location_manually');
        }
        setLocationStatus("❌ " + errorMessage);
        setLocationLoading(false);
        alert(errorMessage);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setApiError(null);
  };

  const handleCropClick = (crop) => {
    setSelectedCrop(crop);
    setShowBudgetModal(true);
  };

  const validateForm = () => {
    if (!form.soil_type) {
      alert(t('select_soil_first'));
      return false;
    }
    if (!form.nitrogen || !form.phosphorous || !form.potassium) {
      alert(t('enter_npk_values'));
      return false;
    }
    return true;
  };

  const getCropEmoji = (crop) => {
    const emojis = {
      rice: "🍚", maize: "🌽", wheat: "🌾", cotton: "🧶", sugarcane: "🎋",
      potato: "🥔", tomato: "🍅", onion: "🧅", groundnut: "🥜", soyabean: "🌱",
      rapeseed: "🌿", jowar: "🌾", jute: "🌿", barley: "🌾", ragi: "🌾",
      moong: "🌱", blackgram: "🌱", pigeonpea: "🌱", banana: "🍌", mango: "🥭",
      grapes: "🍇", watermelon: "🍉", orange: "🍊", papaya: "🍈"
    };
    return emojis[crop.toLowerCase()] || "🌱";
  };

  const getCropColor = (index) => {
    const colors = ["#fbbf24", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];
    return colors[index % colors.length] || "#6366f1";
  };

  const getWeatherEmoji = (temp) => {
    if (temp > 35) return "☀️";
    if (temp > 30) return "⛅";
    if (temp < 15) return "❄️";
    return "☁️";
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setApiError(null);
    try {
      const requestData = {
        N: form.nitrogen ? parseFloat(form.nitrogen) : 50,
        P: form.phosphorous ? parseFloat(form.phosphorous) : 40,
        K: form.potassium ? parseFloat(form.potassium) : 30,
        temperature: form.temperature ? parseFloat(form.temperature) : 25,
        rainfall: form.humidity ? parseFloat(form.humidity) / 0.8 : 200,
        ph: form.ph ? parseFloat(form.ph) : 6.5,
        previous_crop: form.previous_crop || "wheat",
        season: form.season || "kharif"
      };
      const response = await axios.post(`${API_BASE_URL}/predict-crops`, requestData, { headers: { 'Content-Type': 'application/json' } });
      if (response.data && response.data.recommendations) {
        const formattedRecommendations = response.data.recommendations.map((item, index) => {
          const cropName = item.crop.charAt(0).toUpperCase() + item.crop.slice(1);
          const matchPercentage = Math.min(Math.round(item.score * 100), 98);
          return {
            id: index + 1,
            crop: cropName,
            emoji: getCropEmoji(item.crop),
            color: getCropColor(index),
            fertilizer: t('based_on_soil_analysis'),
            fertilizer_details: {
              name: t('recommended_fertilizer'),
              composition: t('based_on_crop_needs'),
              N: Math.round(form.nitrogen) || 50,
              P: Math.round(form.phosphorous) || 40,
              K: Math.round(form.potassium) || 30,
              price_per_kg: 20,
              application_rate: t('as_per_crop_requirement')
            },
            matchPercentage: matchPercentage,
            reasons: [`✓ ${item.reason}`, `✓ ${t('ml_confidence')}: ${(item.score * 100).toFixed(2)}%`],
            duration: t('varies_by_crop'),
            water_needs: t('based_on_crop_type'),
            season: form.season || "kharif",
            yield_potential: t('optimal_with_good_practices'),
            profit_per_ha: t('market_dependent'),
            soil_type: form.soil_type,
            ml_score: item.score
          };
        });
        setResult({
          success: true,
          recommendations: formattedRecommendations,
          farming_advice: [
            `🌱 ${t('top_recommendation')}: ${formattedRecommendations[0].crop}`,
            `📊 ${t('ml_confidence')}: ${(formattedRecommendations[0].ml_score * 100).toFixed(2)}%`,
            `🌡️ ${t('temperature')}: ${form.temperature || 25}°C`,
            `🧪 ${t('soil_ph')}: ${form.ph || 6.5}`,
            `🌾 ${t('previous_crop')}: ${form.previous_crop || "wheat"}`,
            `📅 ${t('season')}: ${form.season || "kharif"}`
          ],
          warnings: [],
          should_wait: false,
          soil_health_score: ((form.nitrogen/50 + form.phosphorous/40 + form.potassium/30) / 3 * 100) / 100,
          confidence: formattedRecommendations[0].matchPercentage,
          current_conditions: {
            temperature: form.temperature || 25,
            humidity: form.humidity || 60,
            moisture: form.moisture || 40,
            soil: form.soil_type,
            ph: form.ph || 6.5,
            previous_crop: form.previous_crop || "wheat",
            season: form.season || "kharif"
          }
        });
      }
    } catch (error) {
      let errorMessage = t('connection_failed');
      if (error.response) errorMessage += `${t('server_error')}: ${error.response.status} - ${error.response.data.error || t('unknown_error')}`;
      else if (error.request) errorMessage += t('server_not_responding');
      else errorMessage += error.message;
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fertilizer-advisor">
      <section className="advisor-hero">
        <div className="hero-content">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="hero-title"><span className="title-gradient">{t('fertilizer_title')}</span><br />{t('advisor')}</h1>
            <p className="hero-subtitle">{t('fertilizer_subtitle')}</p>
            <div className="hero-stats">
              <div className="stat-badge">🚀 {t('accuracy_badge')}</div>
              <div className="stat-badge">🏆 {t('crops_badge')}</div>
              <div className="stat-badge">💓 {t('live_analysis')}</div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="advisor-container">
        <motion.div className="input-panel" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <div className="panel-header">
            <span className="header-icon">🔬</span>
            <h2>{t('field_params')}</h2>
            <p>{t('enter_conditions')}</p>
          </div>

          <div className="location-options">
            <div className="location-buttons">
              <button className={`location-btn ${locationLoading ? 'loading' : ''}`} onClick={getCurrentLocation} disabled={locationLoading}>
                <span className="location-icon">📍</span>{locationLoading ? t('fetching') : t('detect_location')}
              </button>
              <button className="location-btn manual" onClick={() => setShowManualLocation(!showManualLocation)} disabled={locationLoading}>
                <span className="location-icon">✏️</span>{t('type_location')}
              </button>
            </div>
            <AnimatePresence>
              {showManualLocation && (
                <motion.div className="manual-location-form" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <form onSubmit={handleManualLocationSubmit}>
                    <div className="manual-input-row">
                      <div className="manual-input-group"><label>{t('city')}</label><input type="text" value={manualLocation.city} onChange={(e) => setManualLocation({...manualLocation, city: e.target.value})} placeholder={t('city_placeholder')} required /></div>
                      <div className="manual-input-group"><label>{t('country_optional')}</label><input type="text" value={manualLocation.country} onChange={(e) => setManualLocation({...manualLocation, country: e.target.value})} placeholder={t('country_placeholder')} /></div>
                    </div>
                    <div className="manual-form-actions">
                      <button type="submit" className="manual-submit-btn" disabled={locationLoading}>{locationLoading ? t('searching') : t('get_weather_data')}</button>
                      <button type="button" className="manual-cancel-btn" onClick={() => setShowManualLocation(false)}>{t('cancel')}</button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
            {locationLoading && <div className="location-status"><div className="status-spinner"></div><span>{locationStatus}</span></div>}
            {locationData && !locationLoading && (
              <div className="location-success"><span className="success-icon">✅</span><span className="success-text">{locationData.name}</span><span className="success-coords">({locationData.lat}, {locationData.lon})</span></div>
            )}
          </div>

          <div className="clean-input-grid">
            <div className="clean-input-full">
              <label className="clean-label"><span className="label-icon">🌱</span>{t('soil_type')}</label>
              <select name="soil_type" value={form.soil_type} onChange={handleChange} className="clean-select">
                <option value="">{t('select_soil_type')}</option>
                {getSoilOptions().map(soil => <option key={soil.value} value={soil.value}>{soil.label} - {soil.description}</option>)}
              </select>
            </div>
            <div className="clean-input-row">
              <div className="clean-input-group"><label className="clean-label"><span className="label-icon">🌡️</span>{t('temperature')}{locationData && <span className="auto-filled-badge">{t('auto')}</span>}</label><input type="number" name="temperature" placeholder="25" value={form.temperature} onChange={handleChange} className="clean-input" /></div>
              <div className="clean-input-group"><label className="clean-label"><span className="label-icon">💧</span>{t('humidity')}{locationData && <span className="auto-filled-badge">{t('auto')}</span>}</label><input type="number" name="humidity" placeholder="60" value={form.humidity} onChange={handleChange} className="clean-input" /></div>
              <div className="clean-input-group"><label className="clean-label"><span className="label-icon">💦</span>{t('soil_moisture')}{locationData && <span className="auto-filled-badge">{t('est')}</span>}</label><input type="number" name="moisture" placeholder="40" value={form.moisture} onChange={handleChange} className="clean-input" /></div>
            </div>
            <div className="clean-input-row">
              <div className="clean-input-group"><label className="clean-label"><span className="label-icon">🟦</span>{t('nitrogen')}<span className="required-badge">{t('required')}</span></label><input type="number" name="nitrogen" placeholder={t('enter_n_value')} value={form.nitrogen} onChange={handleChange} className="clean-input" /></div>
              <div className="clean-input-group"><label className="clean-label"><span className="label-icon">🟧</span>{t('phosphorous')}<span className="required-badge">{t('required')}</span></label><input type="number" name="phosphorous" placeholder={t('enter_p_value')} value={form.phosphorous} onChange={handleChange} className="clean-input" /></div>
              <div className="clean-input-group"><label className="clean-label"><span className="label-icon">🟩</span>{t('potassium')}<span className="required-badge">{t('required')}</span></label><input type="number" name="potassium" placeholder={t('enter_k_value')} value={form.potassium} onChange={handleChange} className="clean-input" /></div>
            </div>
            <div className="clean-input-row">
              <div className="clean-input-group"><label className="clean-label"><span className="label-icon">🧪</span>{t('soil_ph')}</label><input type="number" step="0.1" name="ph" placeholder="6.5" value={form.ph} onChange={handleChange} className="clean-input" /></div>
              <div className="clean-input-group"><label className="clean-label"><span className="label-icon">🔄</span>{t('previous_crop')}</label><select name="previous_crop" value={form.previous_crop} onChange={handleChange} className="clean-select"><option value="">{t('select_previous_crop')}</option>{getCropOptions().map(crop => <option key={crop.value} value={crop.value}>{crop.label}</option>)}</select></div>
              <div className="clean-input-group"><label className="clean-label"><span className="label-icon">📅</span>{t('season')}</label><select name="season" value={form.season} onChange={handleChange} className="clean-select"><option value="">{t('select_season')}</option>{getSeasonOptions().map(season => <option key={season.value} value={season.value}>{season.label}</option>)}</select></div>
            </div>
            <div className="weather-indicator-box">
              <div className="weather-icon">{getWeatherEmoji(parseFloat(form.temperature) || 25)}</div>
              <div className="weather-details"><span className="weather-label"><span className="data-source-badge">OpenWeatherMap</span></span><span className="weather-value">{form.temperature || "--"}°C | {form.humidity || "--"}% {t('humidity')}</span>{locationData && <small className="raw-value-hint">({t('weather_data_from', { location: locationData.name })})</small>}</div>
            </div>
            <div className="manual-input-reminder"><span className="reminder-icon">📝</span><span>{t('manual_input_reminder')}</span></div>
          </div>

          {apiError && <div className="error-message"><span>⚠️</span><div><strong>{t('connection_error')}</strong><p>{apiError}</p></div></div>}

          <motion.button className="analyze-btn" onClick={handleSubmit} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {loading ? <><div className="spinner"></div><span>{t('analyzing')}</span></> : <><span>🚀</span><span>{t('get_recommendations')}</span></>}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {result && result.success && (
            <motion.div className="results-panel-vertical" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.5 }}>
              <div className="metrics-grid">
                {result.confidence && <div className="metric-card confidence"><div className="metric-icon">💓</div><div className="metric-content"><span className="metric-label">{t('top_match')}</span><span className="metric-value">{result.confidence}%</span></div></div>}
                {result.soil_health_score && <div className="metric-card soil"><div className="metric-icon">🌱</div><div className="metric-content"><span className="metric-label">{t('soil_health')}</span><span className="metric-value">{(result.soil_health_score * 100).toFixed(0)}%</span></div></div>}
                <div className="metric-card conditions"><div className="metric-icon">📊</div><div className="metric-content"><span className="metric-label">{t('npk')}</span><span className="metric-value">{form.nitrogen || "?"}-{form.phosphorous || "?"}-{form.potassium || "?"}</span></div></div>
              </div>
              <div className="recommendations-header-vertical"><h3><span className="header-icon">🏆</span>{t('top_crops', { count: result.recommendations.length })}</h3><p>{t('click_to_optimize')}</p></div>
              <div className="recommendations-vertical">
                {result.recommendations.map((crop, index) => (
                  <motion.div key={crop.id} className={`recommendation-card-vertical ${index === 0 ? 'top-ranked' : ''}`} style={{ borderLeft: `6px solid ${crop.color}` }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} onClick={() => handleCropClick(crop)}>
                    {index === 0 && <div className="crown-badge-vertical">👑 {t('best_match')}</div>}
                    <div className="card-header-vertical"><div className="rank-badge-vertical">#{index + 1}</div><div className="crop-info-vertical"><div className="crop-name-vertical"><span className="crop-emoji-vertical">{crop.emoji}</span><h4>{crop.crop}</h4></div><div className="match-badge-vertical"><span className="match-value">{crop.matchPercentage}% {t('match')}</span></div></div></div>
                    <div className="details-grid-vertical"><div className="detail-item"><span className="detail-icon">🎯</span><span className="detail-label">{t('ml_score')}:</span><span className="detail-value">{(crop.ml_score * 100).toFixed(2)}%</span></div><div className="detail-item"><span className="detail-icon">🌱</span><span className="detail-label">{t('soil_label')}:</span><span className="detail-value">{result.current_conditions.soil}</span></div><div className="detail-item"><span className="detail-icon">🧪</span><span className="detail-label">{t('ph_label')}:</span><span className="detail-value">{result.current_conditions.ph || 6.5}</span></div></div>
                    <div className="reasons-vertical">{crop.reasons.map((reason, idx) => <div key={idx} className="reason-item-vertical">{reason}</div>)}</div>
                    <div className="application-info-vertical"><span>📋 {t('previous_crop_info', { crop: result.current_conditions.previous_crop || "wheat", season: result.current_conditions.season || "kharif" })}</span></div>
                    <div className="budget-optimizer-hint"><span>💰 {t('click_optimize_budget')}</span></div>
                  </motion.div>
                ))}
              </div>
              <div className="advice-section-vertical"><h4><span>📈</span> {t('farming_advice')}</h4><div className="advice-list-vertical">{result.farming_advice.map((advice, idx) => <div key={idx} className="advice-item-vertical">{advice}</div>)}</div></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BudgetOptimizer isOpen={showBudgetModal} onClose={() => setShowBudgetModal(false)} crop={selectedCrop} soilNutrients={{ nitrogen: form.nitrogen, phosphorous: form.phosphorous, potassium: form.potassium }} apiBaseUrl={API_BASE_URL} />
    </div>
  );
}