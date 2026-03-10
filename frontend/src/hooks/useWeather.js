// hooks/useWeather.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { weatherApi } from '../utils/weatherApi';

export const useWeather = (initialLocation = 'auto') => {
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationMethod, setLocationMethod] = useState('detecting');
  const [searchQuery, setSearchQuery] = useState('');

  // Function to get live location
  const getLiveLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('📍 Live location:', { latitude, longitude });
          
          // Try to get city name
          try {
            const response = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const city = response.data.address?.city || 
                        response.data.address?.town || 
                        response.data.address?.village ||
                        'Unknown';
            resolve({ 
              locationString: `${latitude},${longitude}`,
              city,
              coordinates: { latitude, longitude }
            });
          } catch {
            // If reverse geocoding fails, use coordinates
            resolve({ 
              locationString: `${latitude},${longitude}`,
              city: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
              coordinates: { latitude, longitude }
            });
          }
        },
        (error) => {
          console.error('❌ Live location error:', error.message);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // Function to get location from IP
  const getLocationFromIP = async () => {
    try {
      const response = await axios.get('https://ipapi.co/json/');
      return {
        locationString: response.data.city || 'London',
        city: response.data.city || 'London',
        country: response.data.country_name
      };
    } catch (error) {
      return { locationString: 'London', city: 'London' };
    }
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let locationToUse = searchQuery || initialLocation;
        let locationInfo = null;

        if (locationToUse === 'auto') {
          try {
            setLocationMethod('detecting');
            // Try live location first
            locationInfo = await getLiveLocation();
            locationToUse = locationInfo.locationString;
            setUserLocation(locationInfo);
            setLocationMethod('live');
            console.log('✅ Using LIVE location:', locationInfo.city);
          } catch (liveError) {
            // Fallback to IP
            console.log('Live location failed, using IP...');
            locationInfo = await getLocationFromIP();
            locationToUse = locationInfo.locationString;
            setUserLocation(locationInfo);
            setLocationMethod('ip');
            console.log('📍 Using IP location:', locationInfo.city);
          }
        } else {
          // Use user's search query
          setLocationMethod('search');
          console.log('🔍 Using searched location:', locationToUse);
        }

        // Fetch weather data
        const currentData = await weatherApi.getCurrentWeather(locationToUse);
        const forecastData = await weatherApi.getForecast(locationToUse);
        
        // Transform data to match component expectations
        const transformedCurrent = weatherApi.transformWeatherData(currentData);
        const transformedForecast = weatherApi.transformForecastData(forecastData);
        
        setWeatherData(transformedCurrent);
        setForecast(transformedForecast);
        
        const farmingRecs = weatherApi.getFarmingRecommendations(transformedCurrent);
        setRecommendations(farmingRecs);
        
      } catch (err) {
        console.error('❌ Weather fetch error:', err);
        setError(err.message || 'Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [initialLocation, searchQuery]);

  // Function to search for a new location
  const searchLocation = (query) => {
    setSearchQuery(query);
  };

  return { 
    weatherData, 
    forecast, 
    recommendations, 
    loading, 
    error,
    userLocation,
    locationMethod,
    searchLocation
  };
};