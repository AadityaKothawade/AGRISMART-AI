// components/weather/WeatherChart.jsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import './WeatherChart.css';

const WeatherChart = ({ forecastData }) => {
  if (!forecastData) return null;

  const chartData = forecastData.forecast.forecastday.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    maxTemp: day.day.maxtemp_c,
    minTemp: day.day.mintemp_c,
    rainfall: day.day.totalprecip_mm,
    humidity: day.day.avghumidity,
    windSpeed: day.day.maxwind_kph
  }));

  return (
    <div className="weather-charts">
      <div className="chart-container">
        <h3 className="chart-title">Temperature Forecast (7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="maxTemp" stroke="#f97316" name="Max Temp (°C)" />
            <Line type="monotone" dataKey="minTemp" stroke="#3b82f6" name="Min Temp (°C)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h3 className="chart-title">Rainfall Forecast</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="rainfall" fill="#3b82f6" name="Rainfall (mm)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h3 className="chart-title">Humidity & Wind Speed</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="humidity" stroke="#10b981" name="Humidity (%)" />
            <Line yAxisId="right" type="monotone" dataKey="windSpeed" stroke="#8b5cf6" name="Wind Speed (km/h)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeatherChart;