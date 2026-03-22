// components/BudgetOptimizer.jsx
import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import "./BudgetOptimizer.css";

export default function BudgetOptimizer({ 
  isOpen, 
  onClose, 
  crop, 
  soilNutrients,
  apiBaseUrl 
}) {
  const [budgetData, setBudgetData] = useState(null);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budget, setBudget] = useState("");
  const [area, setArea] = useState("1");

  // Budget Input Form Component
  const BudgetInputForm = ({ crop, onSubmit, loading }) => {
    return (
      <div className="budget-input-form">
        <p className="budget-info">
          Optimize fertilizer purchase for {crop.crop} based on your budget and land area
        </p>
        
        <div className="budget-field">
          <label>💰 Budget (₹)</label>
          <input 
            type="number" 
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Enter your total budget"
            min="0"
            step="100"
          />
        </div>
        
        <div className="budget-field">
          <label>🌾 Land Area (hectares)</label>
          <input 
            type="number" 
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Enter land area in hectares"
            step="0.1"
            min="0.1"
          />
        </div>
        
        <button 
          className="budget-submit-btn"
          onClick={() => onSubmit(budget, area)}
          disabled={!budget || loading}
        >
          {loading ? "Optimizing..." : "Optimize Budget"}
        </button>
      </div>
    );
  };

  // Budget Results Component
  const BudgetResults = ({ data, onBack }) => {
    return (
      <div className="budget-results">
        <div className="budget-summary">
          <div className="summary-card">
            <span className="summary-label">Total Budget</span>
            <span className="summary-value">₹{data.total_budget}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Area</span>
            <span className="summary-value">{data.area_hectares} ha</span>
          </div>
          <div className="summary-card profit">
            <span className="summary-label">Expected Profit</span>
            <span className="summary-value">₹{data.profit_estimate}</span>
          </div>
        </div>
        
        <div className="roi-display">
          <div className="roi-circle">
            <span className="roi-value">{data.roi_percentage}%</span>
            <span className="roi-label">ROI</span>
          </div>
          <div className="roi-details">
            <p>💰 Revenue: ₹{data.expected_revenue_rs}</p>
            <p>💸 Spent: ₹{data.total_spent}</p>
            <p>📈 Yield: {data.predicted_yield_tons} tons</p>
          </div>
        </div>
        
        <h4>Recommended Fertilizer Combination</h4>
        <div className="fertilizer-combo">
          {data.optimal_combination.map((item, idx) => (
            <div key={idx} className="combo-item">
              <div className="compo-name">{item.name}</div>
              <div className="compo-details">
                <span>{item.quantity_kg} kg</span>
                <span>₹{item.price_per_kg}/kg</span>
                <span>₹{item.total_cost}</span>
              </div>
              {item.note && <div className="compo-note">{item.note}</div>}
            </div>
          ))}
        </div>
        
        <div className="price-update">
          <small>🔄 Prices updated: {new Date().toLocaleTimeString()}</small>
          <small>Source: AGMARKNET [citation:1]</small>
        </div>
        
        <div className="budget-actions">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <button className="recalculate-btn" onClick={() => {
            onBack();
            onClose();
          }}>
            New Calculation
          </button>
        </div>
      </div>
    );
  };

  const fetchBudgetOptimization = async (budget, area) => {
    setBudgetLoading(true);
    try {
      const response = await axios.post(
        `${apiBaseUrl}/optimize-budget`,
        {
          crop: crop.crop.toLowerCase(),
          budget: parseFloat(budget),
          area: parseFloat(area),
          soil_n: parseFloat(soilNutrients.nitrogen) || 50,
          soil_p: parseFloat(soilNutrients.phosphorous) || 40,
          soil_k: parseFloat(soilNutrients.potassium) || 30
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      if (response.data) {
        setBudgetData(response.data);
      }
    } catch (error) {
      alert("Error fetching budget optimization: " + error.message);
    } finally {
      setBudgetLoading(false);
    }
  };

  const handleReset = () => {
    setBudgetData(null);
    setBudget("");
    setArea("1");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen || !crop) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="budget-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div 
          className="budget-modal"
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="modal-close" onClick={handleClose}>×</button>
          
          <div className="modal-header">
            <span className="modal-crop-emoji">{crop.emoji}</span>
            <h2>{crop.crop} - Budget Optimizer</h2>
          </div>
          
          {!budgetData ? (
            <BudgetInputForm 
              crop={crop}
              onSubmit={fetchBudgetOptimization}
              loading={budgetLoading}
            />
          ) : (
            <BudgetResults 
              data={budgetData}
              onBack={handleReset}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}