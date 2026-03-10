// components/SoybeanAnalyzer.jsx
import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import "./SoybeanAnalyzer.css";

export default function SoybeanAnalyzer() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("single");
  const [explanationImage, setExplanationImage] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Available endpoints
  const endpoints = [
    { 
      id: "single", 
      name: "Single Analysis", 
      endpoint: "/predict",
      icon: "🌱", 
      description: "Analyze one seed with detailed results including top predictions",
      color: "#10b981",
      maxFiles: 1
    },
    { 
      id: "batch", 
      name: "Batch Analysis", 
      endpoint: "/predict_batch",
      icon: "📊", 
      description: "Analyze multiple seeds with class distribution",
      color: "#3b82f6",
      maxFiles: 10
    },
    { 
      id: "explanation", 
      name: "Grad-CAM Analysis", 
      endpoint: "/predict_with_explanation",
      icon: "🧠", 
      description: "Visual explanation of AI decisions with heatmap",
      color: "#8b5cf6",
      maxFiles: 1
    },
  ];

  const handleFileChange = (e) => {
    let selectedFiles = Array.from(e.target.files);
    
    // Get current endpoint info
    const currentEndpoint = endpoints.find(ep => ep.id === activeTab);
    
    // Limit files based on endpoint
    if (currentEndpoint && selectedFiles.length > currentEndpoint.maxFiles) {
      alert(`${currentEndpoint.name} only supports ${currentEndpoint.maxFiles} image${currentEndpoint.maxFiles > 1 ? 's' : ''}. Only the first ${currentEndpoint.maxFiles} will be used.`);
      selectedFiles = selectedFiles.slice(0, currentEndpoint.maxFiles);
    }
    
    setFiles(selectedFiles);

    // Create previews
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
    setResult(null);
    setExplanationImage(null);
    setShowExplanation(false);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setResult(null);
    setExplanationImage(null);
    setShowExplanation(false);
    
    // Clear files if switching to single-image mode with multiple files
    const newEndpoint = endpoints.find(ep => ep.id === tabId);
    if (newEndpoint?.maxFiles === 1 && files.length > 1) {
      setFiles([files[0]]);
      setPreviews([previews[0]]);
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      alert("Please select at least one image");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    
    // Get current endpoint
    const currentEndpoint = endpoints.find(ep => ep.id === activeTab);
    
    // Append files
    files.forEach(file => {
      formData.append('file', file);
    });

    try {
      const response = await axios.post(
        `http://127.0.0.1:5001${currentEndpoint.endpoint}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      
      setResult(response.data);
      
      // Check for explanation image (for Grad-CAM endpoint)
      if (response.data.explanation_image) {
        setExplanationImage(response.data.explanation_image);
        setShowExplanation(true);
      }
      
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.response?.data?.error || "Failed to analyze images. Check backend server."}`);
    }
    setLoading(false);
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 0: return "#10b981"; // Healthy - Green
      case 1: return "#f59e0b"; // Moderate - Orange
      case 2: return "#ef4444"; // Severe - Red
      default: return "#6b7280";
    }
  };

  const getSeverityLabel = (severity) => {
    switch(severity) {
      case 0: return "Healthy";
      case 1: return "Moderate Damage";
      case 2: return "Severe Damage";
      default: return "Unknown";
    }
  };

  const getSeverityEmoji = (severity) => {
    switch(severity) {
      case 0: return "✅";
      case 1: return "⚠️";
      case 2: return "❌";
      default: return "❓";
    }
  };

  const getQualityColor = (quality) => {
    switch(quality?.toLowerCase()) {
      case "good": return "#10b981";
      case "moderate": return "#f59e0b";
      case "poor": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getQualityEmoji = (quality) => {
    switch(quality?.toLowerCase()) {
      case "good": return "🟢";
      case "moderate": return "🟡";
      case "poor": return "🔴";
      default: return "⚪";
    }
  };

  const formatConfidence = (confidence) => {
    return (confidence * 100).toFixed(1);
  };

  const getEndpointIcon = (id) => {
    const endpoint = endpoints.find(ep => ep.id === id);
    return endpoint?.icon || "🌱";
  };

  // Calculate healthy percentage for display
  const getHealthyPercentage = () => {
    if (!result?.summary) return 0;
    return (100 - (result.summary.damaged_percentage || 0)).toFixed(1);
  };

  return (
    <div className="app-page soybean-page">
      {/* Navigation */}
      <nav className="app-nav">
        <div className="nav-content">
          <div className="logo-container">
            <span className="nav-logo-emoji">🌱</span>
            <span className="nav-logo-text">SoyaSense AI</span>
          </div>
          <div className="nav-links">
            <a href="/" className="nav-link">Dashboard</a>
            <a href="/soybean" className="nav-link active">Soybean Analysis</a>
            <a href="/fertilizer" className="nav-link">Fertilizer</a>
            <a href="/budget" className="nav-link">Budget</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="app-content">
        {/* Header */}
        <motion.div 
          className="page-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="header-icon-wrapper">
            <span className="header-emoji">🌱</span>
          </div>
          <h1 className="page-title">Soybean Seed Analyzer</h1>
          <p className="page-subtitle">Advanced AI-powered seed quality detection for maximum yield</p>
        </motion.div>

        {/* Endpoint Cards */}
        <motion.div 
          className="endpoint-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {endpoints.map((endpoint) => (
            <motion.div
              key={endpoint.id}
              className={`endpoint-card ${activeTab === endpoint.id ? 'active' : ''}`}
              onClick={() => handleTabChange(endpoint.id)}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              style={{ borderColor: activeTab === endpoint.id ? endpoint.color : 'transparent' }}
            >
              <div className="endpoint-emoji" style={{ color: endpoint.color }}>
                {endpoint.icon}
              </div>
              <h3 className="endpoint-name">{endpoint.name}</h3>
              <p className="endpoint-description">{endpoint.description}</p>
              <div className="endpoint-badge" style={{ background: endpoint.color }}>
                Max: {endpoint.maxFiles} {endpoint.maxFiles === 1 ? 'image' : 'images'}
              </div>
              {activeTab === endpoint.id && (
                <motion.div 
                  className="endpoint-active-indicator"
                  layoutId="activeIndicator"
                  style={{ background: endpoint.color }}
                />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Main Analyzer Card */}
        <motion.div 
          className="analyzer-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Upload Area */}
          <div className="upload-area">
            <label htmlFor="file-upload" className="upload-label">
              <span className="upload-emoji">📤</span>
              <span className="upload-text">Drop your seed images here</span>
              <span className="upload-hint">
                {endpoints.find(ep => ep.id === activeTab)?.maxFiles === 1 
                  ? "Upload 1 image for analysis" 
                  : "Upload up to 10 images for batch analysis"}
              </span>
            </label>
            <input
              id="file-upload"
              type="file"
              multiple={endpoints.find(ep => ep.id === activeTab)?.maxFiles !== 1}
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
            />
          </div>

          {/* Previews */}
          {previews.length > 0 && (
            <motion.div 
              className="previews-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="previews-title">
                <span className="previews-emoji">🖼️</span>
                Selected Images ({previews.length})
              </h3>
              <div className="previews-grid">
                {previews.map((preview, index) => (
                  <motion.div 
                    key={index} 
                    className="preview-item"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <span className="preview-number">{index + 1}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Analyze Button */}
          <motion.button 
            className="analyze-btn"
            onClick={handleSubmit}
            disabled={loading || files.length === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: `linear-gradient(135deg, ${endpoints.find(ep => ep.id === activeTab)?.color}, ${endpoints.find(ep => ep.id === activeTab)?.color}dd)`
            }}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                <span>Analyzing Seeds...</span>
              </>
            ) : (
              <>
                <span className="btn-emoji">{getEndpointIcon(activeTab)}</span>
                <span>Start {endpoints.find(ep => ep.id === activeTab)?.name}</span>
              </>
            )}
          </motion.button>

          {/* Results Section */}
          <AnimatePresence mode="wait">
            {result && result.success && (
              <motion.div 
                key="results"
                className="results-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {/* Grad-CAM Explanation Image - Only for explanation tab */}
                {activeTab === "explanation" && showExplanation && explanationImage && (
                  <motion.div 
                    className="explanation-section"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="explanation-header">
                      <span className="explanation-emoji">🧠</span>
                      <h3 className="explanation-title">AI Attention Map</h3>
                      <button 
                        className="explanation-toggle"
                        onClick={() => setShowExplanation(!showExplanation)}
                      >
                        {showExplanation ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <div className="explanation-image-container">
                      <img 
                        src={`data:image/jpeg;base64,${explanationImage}`} 
                        alt="Grad-CAM Explanation"
                        className="explanation-image"
                      />
                      <p className="explanation-caption">
                        Heatmap shows which areas influenced the model's decision
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Summary Stats */}
                {result.summary && (
                  <motion.div 
                    className="summary-stats-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="stat-card total">
                      <div className="stat-emoji">🌱</div>
                      <div className="stat-info">
                        <span className="stat-label">Total Seeds</span>
                        <span className="stat-value">{result.summary.total_seeds}</span>
                      </div>
                    </div>

                    <div className="stat-card damaged">
                      <div className="stat-emoji">⚠️</div>
                      <div className="stat-info">
                        <span className="stat-label">Damaged</span>
                        <span className="stat-value">{result.summary.damaged_percentage?.toFixed(1)}%</span>
                      </div>
                    </div>

                    {result.summary.quality_status && (
                      <div className="stat-card quality">
                        <div className="stat-emoji">🛡️</div>
                        <div className="stat-info">
                          <span className="stat-label">Quality</span>
                          <span 
                            className="stat-value quality-text"
                            style={{ color: getQualityColor(result.summary.quality_status) }}
                          >
                            {getQualityEmoji(result.summary.quality_status)} {result.summary.quality_status}
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Quality Bar */}
                {result.summary && (
                  <motion.div 
                    className="quality-section"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="quality-header">
                      <span className="quality-label">Seed Health Index</span>
                      <span className="quality-percentage">
                        {getHealthyPercentage()}% Healthy
                      </span>
                    </div>
                    <div className="quality-bar-container">
                      <motion.div 
                        className="quality-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${getHealthyPercentage()}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        style={{ 
                          background: `linear-gradient(90deg, ${getQualityColor(result.summary.quality_status)}, ${getQualityColor(result.summary.quality_status)}dd)` 
                        }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Distribution Section - Only for batch analysis */}
                {activeTab === "batch" && result.summary?.distribution && (
                  <motion.div 
                    className="distribution-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="section-title">
                      <span className="section-emoji">📊</span> Class Distribution
                    </h3>
                    <div className="distribution-grid">
                      {Object.entries(result.summary.distribution).map(([className, count]) => {
                        // Only show classes with count > 0
                        if (count === 0) return null;
                        const total = result.summary.total_seeds;
                        const percentage = ((count / total) * 100).toFixed(1);
                        
                        // Determine severity for this class
                        let severityClass = "";
                        if (className.includes("Broken") || className.includes("Severe")) {
                          severityClass = "severity-high";
                        } else if (className.includes("Spotted") || className.includes("Skin")) {
                          severityClass = "severity-medium";
                        } else if (className.includes("Immature")) {
                          severityClass = "severity-low";
                        } else if (className.includes("Intact")) {
                          severityClass = "severity-none";
                        }
                        
                        return (
                          <div key={className} className={`distribution-item ${severityClass}`}>
                            <span className="dist-class">{className}</span>
                            <div className="dist-stats">
                              <span className="dist-count">{count}</span>
                              <span className="dist-percentage">{percentage}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Recommendations */}
                {result.summary?.recommendations && result.summary.recommendations.length > 0 && (
                  <motion.div 
                    className="recommendations-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h3 className="section-title">
                      <span className="section-emoji">💡</span> Recommendations
                    </h3>
                    <ul className="recommendations-list">
                      {result.summary.recommendations.map((rec, index) => (
                        <motion.li 
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                        >
                          {rec}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Individual Results */}
                {result.results && result.results.length > 0 && (
                  <motion.div 
                    className="individual-results-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h3 className="section-title">
                      <span className="section-emoji">📋</span> Individual Seed Analysis
                    </h3>
                    <div className="results-grid">
                      {result.results.map((seed, index) => (
                        <motion.div 
                          key={seed.seed_id || index}
                          className="seed-card"
                          style={{ borderLeftColor: getSeverityColor(seed.severity) }}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + index * 0.05 }}
                        >
                          <div className="seed-header">
                            <span className="seed-id">Seed #{seed.seed_id || index + 1}</span>
                            <div className="seed-status">
                              <span className="seed-status-emoji">{getSeverityEmoji(seed.severity)}</span>
                              <span className="seed-severity-badge" style={{ background: getSeverityColor(seed.severity) }}>
                                {getSeverityLabel(seed.severity)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="seed-body">
                            <p className="seed-class">{seed.classification}</p>
                            
                            <div className="seed-confidence">
                              <span className="conf-emoji">📊</span>
                              <span>Confidence: {formatConfidence(seed.confidence)}%</span>
                            </div>
                            
                            {/* Severity Details */}
                            <div className="seed-severity-details">
                              <span className="severity-label">Severity Level:</span>
                              <span className="severity-value" style={{ color: getSeverityColor(seed.severity) }}>
                                {seed.severity} - {getSeverityLabel(seed.severity)}
                              </span>
                            </div>
                          </div>

                          {/* Top Predictions - Show for single analysis and explanation tabs */}
                          {(activeTab === "single" || activeTab === "explanation") && seed.top_predictions && (
                            <div className="seed-top-predictions">
                              <p className="top-pred-title">🔍 Top 3 Predictions:</p>
                              {seed.top_predictions.map((pred, idx) => (
                                <div key={idx} className="top-pred-item">
                                  <span className="pred-class">
                                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"} {pred.class}
                                  </span>
                                  <span 
                                    className="pred-confidence"
                                    style={{ 
                                      color: idx === 0 ? getSeverityColor(seed.severity) : "#666",
                                      fontWeight: idx === 0 ? "bold" : "normal"
                                    }}
                                  >
                                    {formatConfidence(pred.confidence)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Filename */}
                          <div className="seed-filename">
                            <span className="filename-label">📁</span>
                            <span className="filename-value">{seed.filename}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}