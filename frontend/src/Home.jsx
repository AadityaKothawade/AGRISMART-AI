// Home.jsx (simplified - remove the navbar section)
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { FaSeedling, FaFlask, FaChartLine, FaLeaf, FaCloudSun } from "react-icons/fa";
import WeatherWidget from "./components/weather/WeatherWidget";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  const features = [
    {
      id: "soybean",
      title: "Soybean Analyzer",
      description: "AI-powered seed damage detection with pest analysis",
      icon: <FaSeedling />,
      path: "/soybean",
      gradient: "linear-gradient(135deg, #10b981, #059669)"
    },
    {
      id: "fertilizer",
      title: "Fertilizer Optimizer",
      description: "Smart fertilizer recommendations",
      icon: <FaFlask />,
      path: "/fertilizer",
      gradient: "linear-gradient(135deg, #3b82f6, #2563eb)"
    },
    {
      id: "budget",
      title: "Budget Optimizer",
      description: "Maximize yield with optimal allocation",
      icon: <FaChartLine />,
      path: "/budget",
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)"
    },
    {
      id: "weather",
      title: "Weather Insights",
      description: "Real-time weather & farming recommendations",
      icon: <FaCloudSun />,
      path: "/weather",
      gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="home-page">
      {/* Background Pattern */}
      <div className="background-pattern">
        <div className="pattern-circle circle-1"></div>
        <div className="pattern-circle circle-2"></div>
        <div className="pattern-circle circle-3"></div>
      </div>

      {/* Hero Section */}
      <motion.section 
        className="hero-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div 
          className="hero-content"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="hero-title">
            <span className="hero-title-main">Smart Agriculture</span>
            <span className="hero-title-gradient">AI-Powered Solutions</span>
          </h1>
          <p className="hero-subtitle">
            Revolutionizing farming with cutting-edge artificial intelligence. 
            Analyze, optimize, and maximize your agricultural yield.
          </p>
          
          {/* Weather Widget */}
          <div className="hero-weather-wrapper">
            <WeatherWidget />
          </div>

          <div className="hero-buttons">
            <motion.button 
              className="hero-cta-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
            >
              Explore Features
              <FaLeaf className="cta-icon" />
            </motion.button>
            {!isSignedIn && (
              <motion.button 
                className="hero-cta-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/sign-up")}
              >
                Get Started Free
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <motion.h2 
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Our AI-Powered Tools
        </motion.h2>

        <motion.div 
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              className="feature-card"
              variants={itemVariants}
              whileHover={{ y: -10 }}
              onClick={() => isSignedIn ? navigate(feature.path) : navigate("/sign-up")}
            >
              <div 
                className="feature-icon-wrapper"
                style={{ background: feature.gradient }}
              >
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <motion.div className="feature-arrow" whileHover={{ x: 5 }}>
                Learn More →
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          {[
            { number: "98%", label: "Detection Accuracy", delay: 0 },
            { number: "30%", label: "Yield Increase", delay: 0.1 },
            { number: "10k+", label: "Happy Farmers", delay: 0.2 },
            { number: "24/7", label: "AI Assistance", delay: 0.3 }
          ].map((stat, index) => (
            <motion.div 
              key={index}
              className="stat-card"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: stat.delay }}
            >
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <FaLeaf className="footer-icon" />
            <span>AgriSmart AI</span>
          </div>
          <div className="footer-copyright">
            © 2024 AgriSmart AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}