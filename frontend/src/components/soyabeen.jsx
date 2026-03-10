// SoybeanPage.jsx
import React, { useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { FaSeedling, FaUpload, FaDownload, FaLeaf, FaBug, FaChartPie, FaTable } from "react-icons/fa";
import "./SoybeanPage.css";

export default function SoybeanPage() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("table");

  const handleFileChange = (e) => setFiles(e.target.files);

  const handleUpload = async () => {
    if (files.length === 0) return alert("Please select images!");
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append("file", files[i]);
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5001/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Backend Response:", res.data);
      setResults(res.data.results || []);
      setSummary(res.data.summary || {});
    } catch (err) {
      console.error(err);
      alert("Error uploading files! Make sure backend is running on port 5001.");
    }
    setLoading(false);
  };

  const handleDownloadCSV = () => {
    if (results.length === 0) return;
    let csv = "Seed ID,Filename,Classification,Confidence,Severity,Pest Count,Holes Detected\n";
    results.forEach((r) => {
      csv += `${r.seed_id},${r.filename},${r.classification},${(r.confidence)},${r.severity},${r.pest_count},${r.holes_detected}\n`;
    });
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "results.csv");
  };

  const getPieChartData = () => {
    if (!summary || !summary.severity_distribution) {
      return [];
    }
    
    const distribution = summary.severity_distribution;
    
    if (Array.isArray(distribution)) {
      return distribution.map(item => ({
        name: item.name || `Severity ${item.severity || item.level || 'Unknown'}`,
        value: item.value || item.count || 0
      }));
    }
    
    if (typeof distribution === 'object') {
      return Object.entries(distribution).map(([key, value]) => ({
        name: `Severity ${key}`,
        value: typeof value === 'number' ? value : parseInt(value) || 0
      })).filter(item => item.value > 0);
    }
    
    return [];
  };

  const getBarChartData = () => {
    if (!results || results.length === 0) return [];
    
    return results.map(r => ({
      name: r.seed_id || r.filename || 'Unknown',
      pestCount: r.pest_count || 0
    }));
  };

  const hasPieChartData = () => {
    const data = getPieChartData();
    return data.length > 0 && data.some(item => item.value > 0);
  };

  const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6"];

  return (
    <div className="app-page soybean-page">
      {/* Header/Navigation */}
      <nav className="app-nav">
        <div className="nav-content">
          <div className="logo-container">
            <FaLeaf className="nav-logo-icon" />
            <span className="nav-logo-text">AgriSmart AI</span>
          </div>
          <div className="nav-links">
            <a href="/" className="nav-link">Home</a>
            <a href="/soybean" className="nav-link active">Soybean</a>
            <a href="/fertilizer" className="nav-link">Fertilizer</a>
            <a href="/budget" className="nav-link">Budget</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="app-content">
        <motion.div 
          className="page-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="header-icon">
            <FaSeedling />
          </div>
          <h1 className="page-title">Soybean Seed Analyzer</h1>
          <p className="page-subtitle">AI-powered seed damage detection and pest infestation analysis</p>
        </motion.div>

        {/* Upload Section */}
        <motion.div 
          className="upload-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="upload-area">
            <input 
              type="file" 
              multiple 
              onChange={handleFileChange} 
              id="file-upload"
              className="file-input"
            />
            <label htmlFor="file-upload" className="file-label">
              <FaUpload className="upload-icon" />
              <span className="file-label-text">
                {files.length > 0 ? `${files.length} files selected` : 'Choose files or drag and drop'}
              </span>
              <span className="file-label-hint">Supports: JPG, PNG (Max 10MB each)</span>
            </label>
          </div>

          <div className="action-buttons">
            <motion.button 
              className="btn-primary"
              onClick={handleUpload}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <FaUpload /> Upload & Analyze
                </>
              )}
            </motion.button>
            <motion.button 
              className="btn-secondary"
              onClick={handleDownloadCSV}
              disabled={results.length === 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaDownload /> Download CSV
            </motion.button>
          </div>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div 
              className="results-container"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.6 }}
            >
              {/* Tabs */}
              <div className="results-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
                  onClick={() => setActiveTab('table')}
                >
                  <FaTable /> Table View
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('charts')}
                >
                  <FaChartPie /> Charts & Analytics
                </button>
              </div>

              {/* Table View */}
              {activeTab === 'table' && (
                <motion.div 
                  className="table-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="table-container">
                    <table className="results-table">
                      <thead>
                        <tr>
                          <th>Seed ID</th>
                          <th>Classification</th>
                          <th>Confidence</th>
                          <th>Severity</th>
                          <th>Pest Count</th>
                          <th>Holes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r, index) => (
                          <motion.tr 
                            key={r.seed_id || index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <td>
                              <span className="seed-id">{r.seed_id || `Seed-${index + 1}`}</span>
                            </td>
                            <td>
                              <span className={`classification-badge ${(r.classification || 'unknown').toLowerCase()}`}>
                                {r.classification || 'Unknown'}
                              </span>
                            </td>
                            <td>{((r.confidence || 0) * 100).toFixed(2)}%</td>
                            <td>
                              <span className={`severity-badge severity-${r.severity || 0}`}>
                                {r.severity || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <span className="pest-count">
                                <FaBug /> {r.pest_count || 0}
                              </span>
                            </td>
                            <td>{r.holes_detected || 0}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Charts View */}
              {activeTab === 'charts' && (
                <motion.div 
                  className="charts-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Summary Cards */}
                  {summary && (
                    <div className="summary-cards">
                      <motion.div 
                        className="summary-card"
                        whileHover={{ y: -5 }}
                      >
                        <div className="card-icon total">🌱</div>
                        <div className="card-content">
                          <span className="card-label">Total Seeds</span>
                          <span className="card-value">{summary.total_seeds || results.length || 0}</span>
                        </div>
                      </motion.div>
                      <motion.div 
                        className="summary-card"
                        whileHover={{ y: -5 }}
                      >
                        <div className="card-icon damaged">⚠️</div>
                        <div className="card-content">
                          <span className="card-label">Damaged</span>
                          <span className="card-value">{summary.damaged_percentage || 0}%</span>
                        </div>
                      </motion.div>
                      <motion.div 
                        className="summary-card"
                        whileHover={{ y: -5 }}
                      >
                        <div className="card-icon pest">🐛</div>
                        <div className="card-content">
                          <span className="card-label">Avg Pest Count</span>
                          <span className="card-value">{summary.avg_pest_count || 0}</span>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Charts Grid */}
                  <div className="charts-grid">
                    {/* Pie Chart */}
                    <div className="chart-card">
                      <h3 className="chart-title">Severity Distribution</h3>
                      <div className="chart-wrapper">
                        {hasPieChartData() ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={getPieChartData()}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {getPieChartData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="no-data-message">
                            <p>No severity distribution data available</p>
                            <p className="data-hint">Upload images to see distribution</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="chart-card">
                      <h3 className="chart-title">Pest Count per Seed</h3>
                      <div className="chart-wrapper">
                        {results.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                              data={getBarChartData()}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="pestCount" fill="#10b981" name="Pest Count" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="no-data-message">
                            <p>No pest count data available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}