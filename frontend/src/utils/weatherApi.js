// utils/weatherApi.js
import axios from 'axios';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const weatherApi = {
  // Get current weather
  getCurrentWeather: async (location = 'Pune') => {
    try {
      if (!API_KEY) {
        throw new Error('Weather API key is missing. Please check your .env file');
      }
      console.log('📍 Fetching weather for:', location);
      
      // Check if location is coordinates (from live location)
      const params = {
        appid: API_KEY,
        units: 'metric'
      };

      // If location contains comma, it might be lat,lon format
      if (location.includes(',')) {
        const [lat, lon] = location.split(',');
        params.lat = lat.trim();
        params.lon = lon.trim();
      } else {
        params.q = location;
      }

      const response = await axios.get(`${BASE_URL}/weather`, { params });
      console.log('✅ Weather data received:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching weather:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get 5-day forecast
  getForecast: async (location = 'Pune') => {
    try {
      if (!API_KEY) {
        throw new Error('Weather API key is missing');
      }

      const params = {
        appid: API_KEY,
        units: 'metric',
        cnt: 7
      };

      if (location.includes(',')) {
        const [lat, lon] = location.split(',');
        params.lat = lat.trim();
        params.lon = lon.trim();
      } else {
        params.q = location;
      }

      const response = await axios.get(`${BASE_URL}/forecast`, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching forecast:', error.response?.data || error.message);
      throw error;
    }
  },

  // Transform OpenWeatherMap data to match your component structure
  transformWeatherData: (data) => {
    return {
      location: {
        name: data.name || 'Unknown',
        country: data.sys?.country || 'Unknown',
        localtime: new Date(data.dt * 1000).toISOString()
      },
      current: {
        temp_c: data.main?.temp || 0,
        condition: {
          text: data.weather?.[0]?.description || 'Unknown',
          icon: `https://openweathermap.org/img/wn/${data.weather?.[0]?.icon}@2x.png`
        },
        humidity: data.main?.humidity || 0,
        wind_kph: (data.wind?.speed * 3.6) || 0, // Convert m/s to km/h
        precip_mm: data.rain?.['1h'] || 0,
        feelslike_c: data.main?.feels_like || 0
      }
    };
  },

  // Transform forecast data
  transformForecastData: (data) => {
    // Group forecast by day
    const dailyForecasts = {};
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          date: item.dt_txt.split(' ')[0],
          day: {
            maxtemp_c: item.main.temp_max,
            mintemp_c: item.main.temp_min,
            condition: {
              text: item.weather[0].description,
              icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`
            },
            totalprecip_mm: item.rain?.['3h'] || 0,
            avghumidity: item.main.humidity,
            maxwind_kph: (item.wind.speed * 3.6) || 0
          }
        };
      } else {
        // Update max/min temps
        dailyForecasts[date].day.maxtemp_c = Math.max(dailyForecasts[date].day.maxtemp_c, item.main.temp_max);
        dailyForecasts[date].day.mintemp_c = Math.min(dailyForecasts[date].day.mintemp_c, item.main.temp_min);
      }
    });

    return {
      forecast: {
        forecastday: Object.values(dailyForecasts).slice(0, 7)
      }
    };
  },

  getFarmingRecommendations: (weatherData) => {
    const recommendations = [];
    
    if (!weatherData?.current) return recommendations;

    const { current } = weatherData;
    
    if (current.temp_c > 35) {
      recommendations.push({
        type: 'warning',
        title: '🔥 High Temperature Alert',
        advice: 'Consider providing shade for sensitive crops and increase irrigation frequency.'
      });
    } else if (current.temp_c < 10) {
      recommendations.push({
        type: 'warning',
        title: '❄️ Low Temperature Alert',
        advice: 'Protect frost-sensitive plants. Consider using row covers or cold frames.'
      });
    }

    if (current.wind_kph > 30) {
      recommendations.push({
        type: 'warning',
        title: '💨 Strong Winds',
        advice: 'Avoid spraying pesticides. Secure greenhouses and support structures.'
      });
    }

    if (current.humidity > 80) {
      recommendations.push({
        type: 'info',
        title: '💧 High Humidity',
        advice: 'Monitor for fungal diseases. Ensure good air circulation in fields.'
      });
    }

    if (current.precip_mm > 10) {
      recommendations.push({
        type: 'info',
        title: '🌧️ Rainfall Alert',
        advice: 'Good for crops. Ensure proper drainage to prevent waterlogging.'
      });
    }

    return recommendations;
  }
};