// components/BudgetOptimizer.jsx
import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaRupeeSign, FaLeaf, FaChartLine, FaCheckCircle,
  FaInfoCircle, FaBalanceScale
} from "react-icons/fa";
import { GiFarmTractor } from "react-icons/gi";
import "./BudgetOptimizer.css";

export default function BudgetOptimizer() {
  const [budget, setBudget] = useState("");
  const [area, setArea] = useState("1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!budget) {
      alert("Please enter your budget");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:5001/optimize-budget",
        { budget: parseFloat(budget), area: parseFloat(area) }
      );
      setResult(response.data);
    } catch (err) {
      console.error(err);
      alert("Error optimizing budget. Check backend server.");
    }
    setLoading(false);
  };

  return (
    <div className="app-page budget-page">
      <nav className="app-nav">
        <div className="nav-content">
          <div className="logo-container">
            <FaLeaf className="nav-logo-icon" />
            <span className="nav-logo-text">AgriSmart AI</span>
          </div>
          <div className="nav-links">
            <a href="/" className="nav-link">Home</a>
            <a href="/soybean" className="nav-link">Soybean</a>
            <a href="/fertilizer" className="nav-link">Fertilizer</a>
            <a href="/budget" className="nav-link active">Budget</a>
          </div>
        </div>
      </nav>

      <div className="app-content">
        <motion.div 
          className="page-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="header-icon">
            <FaBalanceScale />
          </div>
          <h1 className="page-title">Budget Optimizer</h1>
          <p className="page-subtitle">Maximize your yield with optimal fertilizer combinations</p>
        </motion.div>

        <motion.div 
          className="optimizer-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="input-group">
            <label className="input-label">
              <FaRupeeSign /> Your Budget (₹)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g., 5000"
              className="form-input"
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              <GiFarmTractor /> Land Area (hectares)
            </label>
            <input
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g., 1"
              className="form-input"
            />
          </div>

          <motion.button 
            className="optimize-btn"
            onClick={handleSubmit}
            disabled={loading || !budget}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Optimizing...
              </>
            ) : (
              <>
                <FaChartLine /> Find Best Combination
              </>
            )}
          </motion.button>

          <AnimatePresence>
            {result && result.success && (
              <motion.div 
                className="results-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {/* Summary */}
                <div className="summary-card">
                  <h3 className="summary-title">Optimization Results</h3>
                  <div className="summary-stats">
                    <div className="stat-item">
                      <span className="stat-label">Budget</span>
                      <span className="stat-value">₹{result.budget}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Area</span>
                      <span className="stat-value">{result.area_hectares} ha</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Max Yield</span>
                      <span className="stat-value">{result.maximum_possible_yield} tons</span>
                    </div>
                  </div>
                </div>

                {/* Optimal Combination */}
                {result.optimal_combination && (
                  <div className="optimal-card">
                    <h4 className="optimal-title">
                      <FaCheckCircle /> Optimal Combination
                    </h4>
                    <div className="optimal-details">
                      <div className="fertilizer-item">
                        <span>Urea</span>
                        <strong>{result.optimal_combination.urea_kg} kg</strong>
                      </div>
                      <div className="fertilizer-item">
                        <span>DAP</span>
                        <strong>{result.optimal_combination.dap_kg} kg</strong>
                      </div>
                      <div className="fertilizer-item">
                        <span>MOP</span>
                        <strong>{result.optimal_combination.mop_kg} kg</strong>
                      </div>
                      <div className="total-cost">
                        <span>Total Cost</span>
                        <strong>₹{result.optimal_combination.total_cost}</strong>
                      </div>
                      <div className="expected-yield">
                        <span>Expected Yield</span>
                        <strong>{result.optimal_combination.expected_yield} tons</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Efficient Combinations */}
                {result.top_efficient_combinations && (
                  <div className="efficient-card">
                    <h4 className="efficient-title">
                      <FaChartLine /> Most Efficient Combinations
                    </h4>
                    <div className="efficient-list">
                      {result.top_efficient_combinations.map((combo, index) => (
                        <div key={index} className="efficient-item">
                          <div className="efficient-header">
                            <span className="rank">#{index + 1}</span>
                            <span className="efficiency">Efficiency: {combo.efficiency}</span>
                          </div>
                          <div className="efficient-details">
                            <span>Urea: {combo.urea_kg}kg</span>
                            <span>DAP: {combo.dap_kg}kg</span>
                            <span>MOP: {combo.mop_kg}kg</span>
                          </div>
                          <div className="efficient-stats">
                            <span>Cost: ₹{combo.total_cost}</span>
                            <span>Yield: {combo.expected_yield} tons</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div className="message-card">
                  <FaInfoCircle className="message-icon" />
                  <p>{result.message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}