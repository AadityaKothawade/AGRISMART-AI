import React from "react";
import { useNavigate } from "react-router-dom";
import { useUser, SignInButton, UserButton } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { 
  FaSeedling, 
  FaFlask, 
  FaChartLine, 
  FaLeaf, 
  FaTractor,
  FaArrowRight 
} from "react-icons/fa";
import WeatherWidget from "./components/weather/WeatherWidget";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();

  const features = [
    {
      id: "soybean",
      title: "Soybean Analyzer",
      description: "AI-powered seed damage detection with pest analysis",
      icon: <FaSeedling />,
      color: "#10b981",
      path: "/soybean",
      gradient: "linear-gradient(135deg, #10b981, #059669)"
    },
    {
      id: "fertilizer",
      title: "Fertilizer Optimizer",
      description: "Smart fertilizer recommendations based on soil conditions",
      icon: <FaFlask />,
      color: "#3b82f6",
      path: "/fertilizer",
      gradient: "linear-gradient(135deg, #3b82f6, #2563eb)"
    },
    {
      id: "budget",
      title: "Budget Optimizer",
      description: "Maximize yield with optimal resource allocation",
      icon: <FaChartLine />,
      color: "#f59e0b",
      path: "/budget",
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
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

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="logo-container" onClick={() => navigate("/")}>
            <FaTractor className="nav-logo-icon" />
            <span className="nav-logo-text">AgriSmart AI</span>
          </div>
          
          <div className="nav-center">
            <a href="#features" className="nav-link">Features</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#contact" className="nav-link">Contact</a>
          </div>

          <div className="nav-right">
            {/* Weather Widget */}
            <div className="navbar-weather">
              <WeatherWidget />
            </div>

            {/* Clerk User Profile - Only this, no dashboard */}
            <div className="user-profile-container">
              {isSignedIn ? (
                <div className="signed-in-container">
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "user-avatar",
                        userButtonPopoverCard: "user-popover",
                        userButtonPopoverActions: "user-actions"
                      }
                    }}
                  />
                  <span className="user-name">{user?.firstName || user?.username}</span>
                </div>
              ) : (
                <SignInButton mode="modal">
                  <button className="sign-in-button">
                    <span>Sign In</span>
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>
      </nav>

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
            <span className="hero-title-gradient">AI Solutions</span>
          </h1>
          <p className="hero-subtitle">
            Revolutionizing farming with cutting-edge artificial intelligence. 
            Analyze, optimize, and maximize your agricultural yield.
          </p>
          <motion.button 
            className="hero-cta"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
          >
            Explore Features
            <FaArrowRight className="cta-icon" />
          </motion.button>
          
          {!isSignedIn && (
            <motion.div 
              className="hero-signup-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p>Join thousands of farmers using AI</p>
              <SignInButton mode="modal">
                <button className="hero-signup-btn">Get Started Free →</button>
              </SignInButton>
            </motion.div>
          )}
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
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              className="feature-card"
              variants={itemVariants}
              whileHover={{ 
                y: -10,
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
              }}
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
              <motion.div 
                className="feature-arrow"
                whileHover={{ x: 5 }}
              >
                Learn More <FaArrowRight className="arrow-icon" />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="stat-number">98%</div>
            <div className="stat-label">Detection Accuracy</div>
          </motion.div>
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="stat-number">30%</div>
            <div className="stat-label">Yield Increase</div>
          </motion.div>
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="stat-number">24/7</div>
            <div className="stat-label">AI Assistance</div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <FaTractor className="footer-icon" />
            <span>AgriSmart AI</span>
          </div>
          <div className="footer-links">
            <a href="#features" className="footer-link">Features</a>
            <a href="#about" className="footer-link">About</a>
            <a href="#contact" className="footer-link">Contact</a>
            <a href="#" className="footer-link">Privacy</a>
            <a href="#" className="footer-link">Terms</a>
          </div>
          <div className="footer-copyright">
            © 2024 AgriSmart AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}