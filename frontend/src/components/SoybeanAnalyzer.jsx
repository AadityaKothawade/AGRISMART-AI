// components/SoybeanAnalyzer.jsx
import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import "./SoybeanAnalyzer.css";

export default function SoybeanAnalyzer() {
  const { t } = useLanguage();
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
      name: t('single_analysis'), 
      endpoint: "/predict",
      icon: "🌱", 
      description: t('single_desc'),
      color: "#10b981",
      maxFiles: 1
    },
    { 
      id: "batch", 
      name: t('batch_analysis'), 
      endpoint: "/predict_batch",
      icon: "📊", 
      description: t('batch_desc'),
      color: "#3b82f6",
      maxFiles: 10
    },
    { 
      id: "explanation", 
      name: t('grad_cam_analysis'), 
      endpoint: "/predict_with_explanation",
      icon: "🧠", 
      description: t('grad_desc'),
      color: "#8b5cf6",
      maxFiles: 1
    },
  ];

  const handleFileChange = (e) => {
    let selectedFiles = Array.from(e.target.files);
    const currentEndpoint = endpoints.find(ep => ep.id === activeTab);
    
    if (currentEndpoint && selectedFiles.length > currentEndpoint.maxFiles) {
      const maxMsg = t('max_image', { count: currentEndpoint.maxFiles });
      const maxPluralMsg = t('max_images', { count: currentEndpoint.maxFiles });
      const msg = currentEndpoint.maxFiles === 1 ? maxMsg : maxPluralMsg;
      alert(`${currentEndpoint.name} ${msg}`);
      selectedFiles = selectedFiles.slice(0, currentEndpoint.maxFiles);
    }
    
    setFiles(selectedFiles);
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
    
    const newEndpoint = endpoints.find(ep => ep.id === tabId);
    if (newEndpoint?.maxFiles === 1 && files.length > 1) {
      setFiles([files[0]]);
      setPreviews([previews[0]]);
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      alert(t('please_select_image'));
      return;
    }

    setLoading(true);
    const formData = new FormData();
    const currentEndpoint = endpoints.find(ep => ep.id === activeTab);
    
    files.forEach(file => formData.append('file', file));

    try {
      const response = await axios.post(
        `http://127.0.0.1:5001${currentEndpoint.endpoint}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      setResult(response.data);
      if (response.data.explanation_image) {
        setExplanationImage(response.data.explanation_image);
        setShowExplanation(true);
      }
    } catch (err) {
      console.error(err);
      alert(t('analyze_error', { error: err.response?.data?.error || t('server_error') }));
    }
    setLoading(false);
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 0: return "#10b981";
      case 1: return "#f59e0b";
      case 2: return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getSeverityLabel = (severity) => {
    switch(severity) {
      case 0: return t('healthy');
      case 1: return t('moderate_damage');
      case 2: return t('severe_damage');
      default: return t('unknown');
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

  const formatConfidence = (confidence) => (confidence * 100).toFixed(1);
  const getEndpointIcon = (id) => endpoints.find(ep => ep.id === id)?.icon || "🌱";
  const getHealthyPercentage = () => {
    if (!result?.summary) return 0;
    return (100 - (result.summary.damaged_percentage || 0)).toFixed(1);
  };

  // Helper to render endpoint card name/description dynamically after language change
  const updateEndpointText = () => {
    endpoints.forEach(ep => {
      ep.name = t(ep.id === 'single' ? 'single_analysis' : ep.id === 'batch' ? 'batch_analysis' : 'grad_cam_analysis');
      ep.description = t(ep.id === 'single' ? 'single_desc' : ep.id === 'batch' ? 'batch_desc' : 'grad_desc');
    });
  };
  updateEndpointText(); // Ensure they update when language changes (but since t() is called each render, they will be updated)

  return (
    <div className="app-page soybean-page">
      <nav className="app-nav">
        <div className="nav-content">
          <div className="logo-container">
            <span className="nav-logo-emoji">🌱</span>
            <span className="nav-logo-text">SoyaSense AI</span>
          </div>
          <div className="nav-links">
            <a href="/" className="nav-link">{t('dashboard')}</a>
            <a href="/soybean" className="nav-link active">{t('soybean_analysis')}</a>
            <a href="/fertilizer" className="nav-link">{t('fertilizer')}</a>
            <a href="/budget" className="nav-link">{t('budget')}</a>
          </div>
        </div>
      </nav>

      <div className="app-content">
        <motion.div className="page-header" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="header-icon-wrapper"><span className="header-emoji">🌱</span></div>
          <h1 className="page-title">{t('soybean_title')}</h1>
          <p className="page-subtitle">{t('soybean_subtitle')}</p>
        </motion.div>

        <motion.div className="endpoint-grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          {endpoints.map((endpoint) => (
            <motion.div
              key={endpoint.id}
              className={`endpoint-card ${activeTab === endpoint.id ? 'active' : ''}`}
              onClick={() => handleTabChange(endpoint.id)}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              style={{ borderColor: activeTab === endpoint.id ? endpoint.color : 'transparent' }}
            >
              <div className="endpoint-emoji" style={{ color: endpoint.color }}>{endpoint.icon}</div>
              <h3 className="endpoint-name">{endpoint.name}</h3>
              <p className="endpoint-description">{endpoint.description}</p>
              <div className="endpoint-badge" style={{ background: endpoint.color }}>
                {endpoint.maxFiles === 1 ? t('max_image', { count: endpoint.maxFiles }) : t('max_images', { count: endpoint.maxFiles })}
              </div>
              {activeTab === endpoint.id && <motion.div className="endpoint-active-indicator" layoutId="activeIndicator" style={{ background: endpoint.color }} />}
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="analyzer-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <div className="upload-area">
            <label htmlFor="file-upload" className="upload-label">
              <span className="upload-emoji">📤</span>
              <span className="upload-text">{t('select_images')}</span>
              <span className="upload-hint">
                {endpoints.find(ep => ep.id === activeTab)?.maxFiles === 1 ? t('upload_hint_single') : t('upload_hint_batch')}
              </span>
            </label>
            <input id="file-upload" type="file" multiple={endpoints.find(ep => ep.id === activeTab)?.maxFiles !== 1} accept="image/*" onChange={handleFileChange} className="file-input" />
          </div>

          {previews.length > 0 && (
            <motion.div className="previews-container" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }}>
              <h3 className="previews-title"><span className="previews-emoji">🖼️</span> {t('selected_images')} ({previews.length})</h3>
              <div className="previews-grid">
                {previews.map((preview, index) => (
                  <motion.div key={index} className="preview-item" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: index * 0.05 }}>
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <span className="preview-number">{index + 1}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.button className="analyze-btn" onClick={handleSubmit} disabled={loading || files.length === 0} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{ background: `linear-gradient(135deg, ${endpoints.find(ep => ep.id === activeTab)?.color}, ${endpoints.find(ep => ep.id === activeTab)?.color}dd)` }}>
            {loading ? (
              <><div className="spinner"></div><span>{t('analyzing_seeds')}</span></>
            ) : (
              <><span className="btn-emoji">{getEndpointIcon(activeTab)}</span><span>{t('start_mode', { mode: endpoints.find(ep => ep.id === activeTab)?.name })}</span></>
            )}
          </motion.button>

          <AnimatePresence mode="wait">
            {result && result.success && (
              <motion.div key="results" className="results-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
                {activeTab === "explanation" && showExplanation && explanationImage && (
                  <motion.div className="explanation-section" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
                    <div className="explanation-header">
                      <span className="explanation-emoji">🧠</span>
                      <h3 className="explanation-title">{t('ai_attention_map')}</h3>
                      <button className="explanation-toggle" onClick={() => setShowExplanation(!showExplanation)}>{showExplanation ? t('hide') : t('show')}</button>
                    </div>
                    <div className="explanation-image-container">
                      <img src={`data:image/jpeg;base64,${explanationImage}`} alt={t('grad_cam_alt')} className="explanation-image" />
                      <p className="explanation-caption">{t('heatmap_caption')}</p>
                    </div>
                  </motion.div>
                )}

                {result.summary && (
                  <motion.div className="summary-stats-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <div className="stat-card total"><div className="stat-emoji">🌱</div><div className="stat-info"><span className="stat-label">{t('total_seeds')}</span><span className="stat-value">{result.summary.total_seeds}</span></div></div>
                    <div className="stat-card damaged"><div className="stat-emoji">⚠️</div><div className="stat-info"><span className="stat-label">{t('damaged')}</span><span className="stat-value">{result.summary.damaged_percentage?.toFixed(1)}%</span></div></div>
                    {result.summary.quality_status && (
                      <div className="stat-card quality"><div className="stat-emoji">🛡️</div><div className="stat-info"><span className="stat-label">{t('quality')}</span><span className="stat-value quality-text" style={{ color: getQualityColor(result.summary.quality_status) }}>{getQualityEmoji(result.summary.quality_status)} {result.summary.quality_status}</span></div></div>
                    )}
                  </motion.div>
                )}

                {result.summary && (
                  <motion.div className="quality-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <div className="quality-bar-container">
                      <motion.div className="quality-bar-fill" initial={{ width: 0 }} animate={{ width: `${getHealthyPercentage()}%` }} transition={{ duration: 1, delay: 0.5 }}
                        style={{ background: `linear-gradient(90deg, ${getQualityColor(result.summary.quality_status)}, ${getQualityColor(result.summary.quality_status)}dd)` }} />
                    </div>
                  </motion.div>
                )}

                {activeTab === "batch" && result.summary?.distribution && (
                  <motion.div className="distribution-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    <h3 className="section-title"><span className="section-emoji">📊</span> {t('class_distribution')}</h3>
                    <div className="distribution-grid">
                      {Object.entries(result.summary.distribution).map(([className, count]) => {
                        if (count === 0) return null;
                        const total = result.summary.total_seeds;
                        const percentage = ((count / total) * 100).toFixed(1);
                        let severityClass = "";
                        if (className.includes("Broken") || className.includes("Severe")) severityClass = "severity-high";
                        else if (className.includes("Spotted") || className.includes("Skin")) severityClass = "severity-medium";
                        else if (className.includes("Immature")) severityClass = "severity-low";
                        else if (className.includes("Intact")) severityClass = "severity-none";
                        return (
                          <div key={className} className={`distribution-item ${severityClass}`}>
                            <span className="dist-class">{className}</span>
                            <div className="dist-stats"><span className="dist-count">{count}</span><span className="dist-percentage">{percentage}%</span></div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {result.summary?.recommendations && result.summary.recommendations.length > 0 && (
                  <motion.div className="recommendations-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <h3 className="section-title"><span className="section-emoji">💡</span> {t('recommendations')}</h3>
                    <ul className="recommendations-list">
                      {result.summary.recommendations.map((rec, index) => <motion.li key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + index * 0.1 }}>{rec}</motion.li>)}
                    </ul>
                  </motion.div>
                )}

                {result.results && result.results.length > 0 && (
                  <motion.div className="individual-results-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    <h3 className="section-title"><span className="section-emoji">📋</span> {t('individual_analysis')}</h3>
                    <div className="results-grid">
                      {result.results.map((seed, index) => (
                        <motion.div key={seed.seed_id || index} className="seed-card" style={{ borderLeftColor: getSeverityColor(seed.severity) }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + index * 0.05 }}>
                          <div className="seed-header">
                            <span className="seed-id">{t('seed_id_label')}{seed.seed_id || index + 1}</span>
                            <div className="seed-status">
                              <span className="seed-status-emoji">{getSeverityEmoji(seed.severity)}</span>
                              <span className="seed-severity-badge" style={{ background: getSeverityColor(seed.severity) }}>{getSeverityLabel(seed.severity)}</span>
                            </div>
                          </div>
                          <div className="seed-body">
                            <p className="seed-class">{seed.classification}</p>
                            <div className="seed-confidence"><span className="conf-emoji">📊</span><span>{t('confidence_label')}: {formatConfidence(seed.confidence)}%</span></div>
                            <div className="seed-severity-details"><span className="severity-label">{t('severity_level')}:</span><span className="severity-value" style={{ color: getSeverityColor(seed.severity) }}>{seed.severity} - {getSeverityLabel(seed.severity)}</span></div>
                          </div>
                          {(activeTab === "single" || activeTab === "explanation") && seed.top_predictions && (
                            <div className="seed-top-predictions">
                              <p className="top-pred-title">🔍 {t('top_predictions')}</p>
                              {seed.top_predictions.map((pred, idx) => (
                                <div key={idx} className="top-pred-item">
                                  <span className="pred-class">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"} {pred.class}</span>
                                  <span className="pred-confidence" style={{ color: idx === 0 ? getSeverityColor(seed.severity) : "#666", fontWeight: idx === 0 ? "bold" : "normal" }}>{formatConfidence(pred.confidence)}%</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="seed-filename"><span className="filename-label">📁</span><span className="filename-value">{seed.filename}</span></div>
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