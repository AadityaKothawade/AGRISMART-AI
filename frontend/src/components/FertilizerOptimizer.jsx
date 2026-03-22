// components/FertilizerOptimizer.jsx
import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import BudgetOptimizer from "./BudgetOptimizer";
import "./FertilizerOptimizer.css";

export default function FertilizerOptimizer() {
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
  const [manualLocation, setManualLocation] = useState({
    city: "",
    country: ""
  });
  
  // Budget Modal States
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);

  // API Keys - Replace with your actual OpenWeatherMap API key
  const OPENWEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY; // Get from https://home.openweathermap.org/api_keys

  const soilOptions = [
    { value: "Sandy", label: "Sandy Soil", description: "Well-draining, low nutrients", npkRatio: { n: 1, p: 0.4, k: 0.3 } },
    { value: "Loamy", label: "Loamy Soil", description: "Ideal, balanced texture", npkRatio: { n: 1, p: 0.8, k: 0.8 } },
    { value: "Black", label: "Black Soil", description: "Rich in clay, good for cotton", npkRatio: { n: 1, p: 0.5, k: 1.0 } },
    { value: "Red", label: "Red Soil", description: "Iron-rich, moderate fertility", npkRatio: { n: 1, p: 0.3, k: 0.4 } },
    { value: "Clayey", label: "Clayey Soil", description: "Water-retentive, heavy", npkRatio: { n: 1, p: 0.6, k: 1.2 } }
  ];

  const seasonOptions = [
    { value: "kharif", label: "Kharif (Monsoon Crops)" },
    { value: "rabi", label: "Rabi (Winter Crops)" },
    { value: "zaid", label: "Zaid (Summer Crops)" }
  ];

  const cropOptions = [
    { value: "rice", label: "Rice" },
    { value: "wheat", label: "Wheat" },
    { value: "maize", label: "Maize" },
    { value: "cotton", label: "Cotton" },
    { value: "sugarcane", label: "Sugarcane" },
    { value: "groundnut", label: "Groundnut" },
    { value: "soyabean", label: "Soyabean" }
  ];

  // API Base URL for your backend
  const API_BASE_URL = "http://127.0.0.1:5001";

  // Function to estimate soil moisture from weather data
  const estimateSoilMoisture = (humidity, temperature, rainfall = 0) => {
    // Empirical formula based on weather parameters
    // Higher humidity and rainfall increase moisture, higher temperature decreases it
    const baseMoisture = humidity * 0.6;
    const rainEffect = rainfall * 2;
    const tempEffect = temperature > 30 ? -15 : (temperature < 15 ? 10 : 0);
    
    let moisture = baseMoisture + rainEffect + tempEffect;
    
    // Constrain to realistic range (10% - 80%)
    return Math.min(80, Math.max(10, moisture));
  };

  // Function to get location name from coordinates (reverse geocoding)
  const getLocationName = async (lat, lon) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_API_KEY}`
      );
      
      if (response.data && response.data[0]) {
        const location = response.data[0];
        return `${location.name}, ${location.country}`;
      }
    } catch (error) {
      console.log("Reverse geocoding error:", error);
    }
    return `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
  };

  // Function to get coordinates from city name
  const getCoordinatesFromCity = async (city, country) => {
    try {
      setLocationStatus("🔍 Searching for location...");
      const query = country ? `${city},${country}` : city;
      
      const response = await axios.get(
        `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=1&appid=${OPENWEATHER_API_KEY}`
      );
      
      if (response.data && response.data[0]) {
        const location = response.data[0];
        return {
          lat: location.lat,
          lon: location.lon,
          name: `${location.name}, ${location.country}`
        };
      } else {
        throw new Error("Location not found");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      throw error;
    }
  };

  // Handle manual location submission
  const handleManualLocationSubmit = async (e) => {
    e.preventDefault();
    
    if (!manualLocation.city) {
      alert("Please enter a city name");
      return;
    }
    
    setLocationLoading(true);
    setLocationStatus("🔍 Getting location data...");
    
    try {
      const location = await getCoordinatesFromCity(manualLocation.city, manualLocation.country);
      await fetchDataFromLocation(location.lat, location.lon, location.name);
      setShowManualLocation(false);
    } catch (error) {
      setLocationStatus("❌ Location not found");
      alert("Location not found. Please check the city name and try again.");
    } finally {
      setLocationLoading(false);
    }
  };

  // Main function to fetch weather data from location
  const fetchDataFromLocation = async (lat, lon, locationName = null) => {
    setLocationLoading(true);
    setLocationStatus("📍 Getting location data...");
    
    try {
      // Get location name if not provided
      if (!locationName) {
        locationName = await getLocationName(lat, lon);
      }
      
      // Fetch weather data from OpenWeatherMap
      setLocationStatus("🌤️ Fetching weather data from OpenWeatherMap...");
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      
      const weatherData = weatherResponse.data;
      const temperature = weatherData.main.temp;
      const humidity = weatherData.main.humidity;
      const rainfall = weatherData.rain ? weatherData.rain['1h'] || weatherData.rain['3h'] || 0 : 0;
      
      // Estimate soil moisture from weather data
      const estimatedMoisture = estimateSoilMoisture(humidity, temperature, rainfall);
      
      // Store location data for display
      setLocationData({
        name: locationName,
        lat: lat.toFixed(4),
        lon: lon.toFixed(4)
      });
      
      // Update form with ONLY weather data - preserve existing NPK values
      setForm(prev => ({
        ...prev,
        temperature: temperature.toFixed(1),
        humidity: Math.round(humidity),
        moisture: Math.round(estimatedMoisture)
        // NOT updating nitrogen, phosphorous, potassium, ph, or soil_type
        // These fields will keep their existing values or remain empty for manual input
      }));
      
      setLocationStatus(`✅ Weather data fetched from ${locationName}`);
      
    } catch (error) {
      console.error("Error fetching location data:", error);
      
      let errorMessage = "❌ Failed to fetch weather data: ";
      if (error.response?.status === 401) {
        errorMessage += "Invalid API key. Please check your OpenWeatherMap API key.";
      } else if (error.response?.status === 404) {
        errorMessage += "Location not found.";
      } else {
        errorMessage += "Please check your connection and try again.";
      }
      
      setLocationStatus(errorMessage);
      alert(errorMessage);
    } finally {
      setLocationLoading(false);
    }
  };

  // Get current location and fetch data
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setLocationStatus("📍 Requesting location access...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchDataFromLocation(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Could not get your location. ";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please enable location access and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "Please enter location manually.";
        }
        
        setLocationStatus("❌ " + errorMessage);
        setLocationLoading(false);
        alert(errorMessage);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000,
        maximumAge: 0
      }
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
      alert("🌱 Please select your soil type first");
      return false;
    }
    
    // Check if NPK values are entered
    if (!form.nitrogen || !form.phosphorous || !form.potassium) {
      alert("📊 Please enter Nitrogen (N), Phosphorous (P), and Potassium (K) values");
      return false;
    }
    
    return true;
  };

  const getCropEmoji = (crop) => {
    const emojis = {
      "rice": "🍚",
      "maize": "🌽",
      "wheat": "🌾",
      "cotton": "🧶",
      "sugarcane": "🎋",
      "potato": "🥔",
      "tomato": "🍅",
      "onion": "🧅",
      "groundnut": "🥜",
      "soyabean": "🌱",
      "rapeseed": "🌿",
      "jowar": "🌾",
      "jute": "🌿",
      "barley": "🌾",
      "ragi": "🌾",
      "moong": "🌱",
      "blackgram": "🌱",
      "pigeonpea": "🌱",
      "banana": "🍌",
      "mango": "🥭",
      "grapes": "🍇",
      "watermelon": "🍉",
      "orange": "🍊",
      "papaya": "🍈"
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

      console.log("Sending request:", requestData);

      const response = await axios.post(
        `${API_BASE_URL}/predict-crops`,
        requestData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data && response.data.recommendations) {
        const formattedRecommendations = response.data.recommendations.map((item, index) => {
          const cropName = item.crop.charAt(0).toUpperCase() + item.crop.slice(1);
          const matchPercentage = Math.min(Math.round(item.score * 100), 98);
          
          return {
            id: index + 1,
            crop: cropName,
            emoji: getCropEmoji(item.crop),
            color: getCropColor(index),
            fertilizer: "Based on soil analysis",
            fertilizer_details: {
              name: "Recommended fertilizer",
              composition: "Based on crop needs",
              N: Math.round(form.nitrogen) || 50,
              P: Math.round(form.phosphorous) || 40,
              K: Math.round(form.potassium) || 30,
              price_per_kg: 20,
              application_rate: "As per crop requirement"
            },
            matchPercentage: matchPercentage,
            reasons: [
              `✓ ${item.reason}`,
              `✓ ML Confidence: ${(item.score * 100).toFixed(2)}%`
            ],
            duration: "Varies by crop",
            water_needs: "Based on crop type",
            season: form.season || "kharif",
            yield_potential: "Optimal with good practices",
            profit_per_ha: "Market dependent",
            soil_type: form.soil_type,
            ml_score: item.score
          };
        });

        setResult({
          success: true,
          recommendations: formattedRecommendations,
          farming_advice: [
            `🌱 Top recommendation: ${formattedRecommendations[0].crop}`,
            `📊 ML Confidence: ${(formattedRecommendations[0].ml_score * 100).toFixed(2)}%`,
            `🌡️ Temperature: ${form.temperature || 25}°C`,
            `🧪 Soil pH: ${form.ph || 6.5}`,
            `🌾 Previous crop: ${form.previous_crop || "wheat"}`,
            `📅 Season: ${form.season || "kharif"}`
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
      let errorMessage = "⚠️ Connection failed. ";
      if (error.response) {
        errorMessage += `Server: ${error.response.status} - ${error.response.data.error || 'Unknown error'}`;
      } else if (error.request) {
        errorMessage += "Server not responding. Start Flask server on port 5001";
      } else {
        errorMessage += error.message;
      }
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fertilizer-advisor">
      {/* Hero Section */}
      <section className="advisor-hero">
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="hero-title">
              <span className="title-gradient">Smart Crop & Fertilizer</span>
              <br />Advisor
            </h1>
            <p className="hero-subtitle">
              ML-Powered Crop Recommendations • Real-time Analysis • Maximum Profit
            </p>
            <div className="hero-stats">
              <div className="stat-badge">🚀 98% Accuracy</div>
              <div className="stat-badge">🏆 20+ Crops</div>
              <div className="stat-badge">💓 Live Analysis</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="advisor-container">
        {/* Input Form - Clean Box Style */}
        <motion.div 
          className="input-panel"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="panel-header">
            <span className="header-icon">🔬</span>
            <h2>Field Parameters</h2>
            <p>Enter your soil and weather conditions</p>
          </div>

          {/* Location Options */}
          <div className="location-options">
            <div className="location-buttons">
              <button 
                className={`location-btn ${locationLoading ? 'loading' : ''}`}
                onClick={getCurrentLocation}
                disabled={locationLoading}
              >
                <span className="location-icon">📍</span>
                {locationLoading ? "Fetching..." : "Detect My Location"}
              </button>
              
              <button 
                className="location-btn manual"
                onClick={() => setShowManualLocation(!showManualLocation)}
                disabled={locationLoading}
              >
                <span className="location-icon">✏️</span>
                Type Location
              </button>
            </div>

            {/* Manual Location Input Form */}
            <AnimatePresence>
              {showManualLocation && (
                <motion.div 
                  className="manual-location-form"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <form onSubmit={handleManualLocationSubmit}>
                    <div className="manual-input-row">
                      <div className="manual-input-group">
                        <label>City *</label>
                        <input
                          type="text"
                          value={manualLocation.city}
                          onChange={(e) => setManualLocation({...manualLocation, city: e.target.value})}
                          placeholder="e.g., London"
                          required
                        />
                      </div>
                      <div className="manual-input-group">
                        <label>Country (optional)</label>
                        <input
                          type="text"
                          value={manualLocation.country}
                          onChange={(e) => setManualLocation({...manualLocation, country: e.target.value})}
                          placeholder="e.g., UK"
                        />
                      </div>
                    </div>
                    <div className="manual-form-actions">
                      <button type="submit" className="manual-submit-btn" disabled={locationLoading}>
                        {locationLoading ? "Searching..." : "Get Weather Data"}
                      </button>
                      <button 
                        type="button" 
                        className="manual-cancel-btn"
                        onClick={() => setShowManualLocation(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Location Status */}
            {locationLoading && (
              <div className="location-status">
                <div className="status-spinner"></div>
                <span>{locationStatus}</span>
              </div>
            )}
            
            {locationData && !locationLoading && (
              <div className="location-success">
                <span className="success-icon">✅</span>
                <span className="success-text">{locationData.name}</span>
                <span className="success-coords">({locationData.lat}, {locationData.lon})</span>
              </div>
            )}
          </div>

          <div className="clean-input-grid">
            {/* Soil Type - Full Width */}
            <div className="clean-input-full">
              <label className="clean-label">
                <span className="label-icon">🌱</span>
                Soil Type
              </label>
              <select
                name="soil_type"
                value={form.soil_type}
                onChange={handleChange}
                className="clean-select"
              >
                <option value="">Select soil type</option>
                {soilOptions.map(soil => (
                  <option key={soil.value} value={soil.value}>
                    {soil.label} - {soil.description}
                  </option>
                ))}
              </select>
            </div>

            {/* First Row - Climate Data (Auto-filled from location) */}
            <div className="clean-input-row">
              <div className="clean-input-group">
                <label className="clean-label">
                  <span className="label-icon">🌡️</span>
                  Temperature (°C)
                  {locationData && <span className="auto-filled-badge">Auto</span>}
                </label>
                <input
                  type="number"
                  name="temperature"
                  placeholder="25"
                  value={form.temperature}
                  onChange={handleChange}
                  className="clean-input"
                />
              </div>

              <div className="clean-input-group">
                <label className="clean-label">
                  <span className="label-icon">💧</span>
                  Humidity (%)
                  {locationData && <span className="auto-filled-badge">Auto</span>}
                </label>
                <input
                  type="number"
                  name="humidity"
                  placeholder="60"
                  value={form.humidity}
                  onChange={handleChange}
                  className="clean-input"
                />
              </div>

              <div className="clean-input-group">
                <label className="clean-label">
                  <span className="label-icon">💦</span>
                  Soil Moisture (%)
                  {locationData && <span className="auto-filled-badge">Est.</span>}
                </label>
                <input
                  type="number"
                  name="moisture"
                  placeholder="40"
                  value={form.moisture}
                  onChange={handleChange}
                  className="clean-input"
                />
              </div>
            </div>

            {/* Second Row - NPK Values (Manual Input - No auto-fill) */}
            <div className="clean-input-row">
              <div className="clean-input-group">
                <label className="clean-label">
                  <span className="label-icon">🟦</span>
                  Nitrogen (N) - mg/kg
                  <span className="required-badge">Required</span>
                </label>
                <input
                  type="number"
                  name="nitrogen"
                  placeholder="Enter N value"
                  value={form.nitrogen}
                  onChange={handleChange}
                  className="clean-input"
                />
              </div>

              <div className="clean-input-group">
                <label className="clean-label">
                  <span className="label-icon">🟧</span>
                  Phosphorous (P) - mg/kg
                  <span className="required-badge">Required</span>
                </label>
                <input
                  type="number"
                  name="phosphorous"
                  placeholder="Enter P value"
                  value={form.phosphorous}
                  onChange={handleChange}
                  className="clean-input"
                />
              </div>

              <div className="clean-input-group">
                <label className="clean-label">
                  <span className="label-icon">🟩</span>
                  Potassium (K) - mg/kg
                  <span className="required-badge">Required</span>
                </label>
                <input
                  type="number"
                  name="potassium"
                  placeholder="Enter K value"
                  value={form.potassium}
                  onChange={handleChange}
                  className="clean-input"
                />
              </div>
            </div>

            {/* Third Row - pH and Crop Rotation */}
            <div className="clean-input-row">
              <div className="clean-input-group">
                <label className="clean-label">
                  <span className="label-icon">🧪</span>
                  Soil pH
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="ph"
                  placeholder="6.5"
                  value={form.ph}
                  onChange={handleChange}
                  className="clean-input"
                />
              </div>

              <div className="clean-input-group">
                <label className="clean-label">
                  <span className="label-icon">🔄</span>
                  Previous Crop
                </label>
                <select
                  name="previous_crop"
                  value={form.previous_crop}
                  onChange={handleChange}
                  className="clean-select"
                >
                  <option value="">Select previous crop</option>
                  {cropOptions.map(crop => (
                    <option key={crop.value} value={crop.value}>
                      {crop.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="clean-input-group">
                <label className="clean-label">
                  <span className="label-icon">📅</span>
                  Season
                </label>
                <select
                  name="season"
                  value={form.season}
                  onChange={handleChange}
                  className="clean-select"
                >
                  <option value="">Select season</option>
                  {seasonOptions.map(season => (
                    <option key={season.value} value={season.value}>
                      {season.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Weather Indicator */}
            <div className="weather-indicator-box">
              <div className="weather-icon">
                {getWeatherEmoji(parseFloat(form.temperature) || 25)}
              </div>
              <div className="weather-details">
                <span className="weather-label">
                  <span className="data-source-badge">OpenWeatherMap</span>
                </span>
                <span className="weather-value">
                  {form.temperature || "--"}°C | {form.humidity || "--"}% Humidity
                </span>
                {locationData && (
                  <small className="raw-value-hint">
                    (Weather data from {locationData.name})
                  </small>
                )}
              </div>
            </div>

            {/* Manual Input Reminder */}
            <div className="manual-input-reminder">
              <span className="reminder-icon">📝</span>
              <span>Please enter Nitrogen (N), Phosphorous (P), and Potassium (K) values manually</span>
            </div>
          </div>

          {apiError && (
            <div className="error-message">
              <span>⚠️</span>
              <div>
                <strong>Connection Error</strong>
                <p>{apiError}</p>
              </div>
            </div>
          )}

          <motion.button 
            className="analyze-btn"
            onClick={handleSubmit}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Get Recommendations</span>
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Results Section - Vertical Layout */}
        <AnimatePresence>
          {result && result.success && (
            <motion.div 
              className="results-panel-vertical"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
            >
              {/* ML Metrics */}
              <div className="metrics-grid">
                {result.confidence && (
                  <div className="metric-card confidence">
                    <div className="metric-icon">💓</div>
                    <div className="metric-content">
                      <span className="metric-label">Top Match</span>
                      <span className="metric-value">{result.confidence}%</span>
                    </div>
                  </div>
                )}
                {result.soil_health_score && (
                  <div className="metric-card soil">
                    <div className="metric-icon">🌱</div>
                    <div className="metric-content">
                      <span className="metric-label">Soil Health</span>
                      <span className="metric-value">{(result.soil_health_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}
                <div className="metric-card conditions">
                  <div className="metric-icon">📊</div>
                  <div className="metric-content">
                    <span className="metric-label">N-P-K</span>
                    <span className="metric-value">
                      {form.nitrogen || "?"}-{form.phosphorous || "?"}-{form.potassium || "?"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendations Header */}
              <div className="recommendations-header-vertical">
                <h3>
                  <span className="header-icon">🏆</span>
                  Top {result.recommendations.length} Crop Recommendations
                </h3>
                <p>Click on any crop to optimize fertilizer budget</p>
              </div>

              {/* Vertical Recommendations List */}
              <div className="recommendations-vertical">
                {result.recommendations.map((crop, index) => (
                  <motion.div
                    key={crop.id}
                    className={`recommendation-card-vertical ${index === 0 ? 'top-ranked' : ''}`}
                    style={{ borderLeft: `6px solid ${crop.color}` }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleCropClick(crop)}
                  >
                    {index === 0 && <div className="crown-badge-vertical">👑 Best Match</div>}
                    
                    <div className="card-header-vertical">
                      <div className="rank-badge-vertical">#{index + 1}</div>
                      <div className="crop-info-vertical">
                        <div className="crop-name-vertical">
                          <span className="crop-emoji-vertical">{crop.emoji}</span>
                          <h4>{crop.crop}</h4>
                        </div>
                        <div className="match-badge-vertical">
                          <span className="match-value">{crop.matchPercentage}% Match</span>
                        </div>
                      </div>
                    </div>

                    <div className="details-grid-vertical">
                      <div className="detail-item">
                        <span className="detail-icon">🎯</span>
                        <span className="detail-label">ML Score:</span>
                        <span className="detail-value">{(crop.ml_score * 100).toFixed(2)}%</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🌱</span>
                        <span className="detail-label">Soil:</span>
                        <span className="detail-value">{result.current_conditions.soil}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🧪</span>
                        <span className="detail-label">pH:</span>
                        <span className="detail-value">{result.current_conditions.ph || 6.5}</span>
                      </div>
                    </div>

                    <div className="reasons-vertical">
                      {crop.reasons.map((reason, idx) => (
                        <div key={idx} className="reason-item-vertical">
                          {reason}
                        </div>
                      ))}
                    </div>

                    <div className="application-info-vertical">
                      <span>📋 Previous crop: {result.current_conditions.previous_crop || "wheat"} | Season: {result.current_conditions.season || "kharif"}</span>
                    </div>
                    
                    <div className="budget-optimizer-hint">
                      <span>💰 Click to optimize fertilizer budget →</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Advice Section */}
              <div className="advice-section-vertical">
                <h4><span>📈</span> Farming Advice</h4>
                <div className="advice-list-vertical">
                  {result.farming_advice.map((advice, idx) => (
                    <div key={idx} className="advice-item-vertical">
                      {advice}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Budget Optimization Modal */}
      <BudgetOptimizer 
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        crop={selectedCrop}
        soilNutrients={{
          nitrogen: form.nitrogen,
          phosphorous: form.phosphorous,
          potassium: form.potassium
        }}
        apiBaseUrl={API_BASE_URL}
      />
    </div>
  );
}