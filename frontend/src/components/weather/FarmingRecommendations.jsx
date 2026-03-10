// components/weather/FarmingRecommendations.jsx
import React from 'react';
import './FarmingRecommendations.css';

const FarmingRecommendations = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="recommendations-container favorable">
        <p className="favorable-text">Weather conditions are favorable for farming activities.</p>
      </div>
    );
  }

  return (
    <div className="recommendations-container">
      <h3 className="recommendations-title">Farming Recommendations</h3>
      <div className="recommendations-list">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`recommendation-card ${rec.type}`}
          >
            <div className="recommendation-content">
              <h4 className="recommendation-title">{rec.title}</h4>
              <p className="recommendation-advice">{rec.advice}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FarmingRecommendations;