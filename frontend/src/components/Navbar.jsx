// components/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, SignInButton, UserButton } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaTractor, 
  FaSeedling, 
  FaFlask, 
  FaChartLine, 
  FaCloudSun,
  FaLeaf,
  FaChevronDown,
  FaInfoCircle,
  FaEnvelope,
  FaPhone
} from "react-icons/fa";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const featuresRef = useRef(null);
  const aboutRef = useRef(null);

  const features = [
    {
      id: "soybean",
      title: "Soybean Analyzer",
      description: "AI seed damage detection",
      icon: <FaSeedling />,
      path: "/soybean",
      color: "#10b981"
    },
    {
      id: "fertilizer",
      title: "Fertilizer Optimizer",
      description: "Smart fertilizer recommendations",
      icon: <FaFlask />,
      path: "/fertilizer",
      color: "#3b82f6"
    },
    {
      id: "budget",
      title: "Budget Optimizer",
      description: "Maximize yield with optimal allocation",
      icon: <FaChartLine />,
      path: "/budget",
      color: "#f59e0b"
    },
    {
      id: "weather",
      title: "Weather Insights",
      description: "Real-time weather & farming advice",
      icon: <FaCloudSun />,
      path: "/weather",
      color: "#8b5cf6"
    }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (featuresRef.current && !featuresRef.current.contains(event.target)) {
        setFeaturesOpen(false);
      }
      if (aboutRef.current && !aboutRef.current.contains(event.target)) {
        setAboutOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <div className="nav-logo" onClick={() => navigate("/")}>
          <FaTractor className="logo-icon" />
          <span className="logo-text">AgriSmart AI</span>
        </div>

        {/* Navigation Links */}
       

        {/* Right Section - User Profile */}
        <div className="nav-right">
           <div className="nav-links">
          {/* Features Dropdown */}
          <div className="dropdown" ref={featuresRef}>
            <button 
              className="dropdown-trigger"
              onClick={() => setFeaturesOpen(!featuresOpen)}
              onMouseEnter={() => setFeaturesOpen(true)}
            >
              <FaLeaf className="trigger-icon" />
              Features
              <FaChevronDown className={`chevron ${featuresOpen ? 'open' : ''}`} />
            </button>

            <AnimatePresence>
              {featuresOpen && (
                <motion.div 
                  className="dropdown-menu features-menu"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onMouseLeave={() => setFeaturesOpen(false)}
                >
                  {features.map((feature) => (
                    <motion.div
                      key={feature.id}
                      className="feature-item"
                      onClick={() => {
                        navigate(feature.path);
                        setFeaturesOpen(false);
                      }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="feature-icon" style={{ color: feature.color }}>
                        {feature.icon}
                      </div>
                      <div className="feature-info">
                        <h4>{feature.title}</h4>
                        <p>{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* About Dropdown */}
          <div className="dropdown" ref={aboutRef}>
            <button 
              className="dropdown-trigger"
              onClick={() => setAboutOpen(!aboutOpen)}
              onMouseEnter={() => setAboutOpen(true)}
            >
              <FaInfoCircle className="trigger-icon" />
              About
              <FaChevronDown className={`chevron ${aboutOpen ? 'open' : ''}`} />
            </button>

            <AnimatePresence>
              {aboutOpen && (
                <motion.div 
                  className="dropdown-menu about-menu"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onMouseLeave={() => setAboutOpen(false)}
                >
                  <div className="about-section">
                    <h4>About AgriSmart AI</h4>
                    <p>Revolutionizing agriculture with cutting-edge AI technology. We help farmers optimize their yield, reduce costs, and make data-driven decisions.</p>
                  </div>
                  
                  <div className="about-links">
                    <a href="#mission" className="about-link">
                      <FaLeaf /> Our Mission
                    </a>
                    <a href="#team" className="about-link">
                      <FaInfoCircle /> Our Team
                    </a>
                    <a href="#contact" className="about-link">
                      <FaEnvelope /> Contact
                    </a>
                    <a href="#phone" className="about-link">
                      <FaPhone /> +1 (555) 123-4567
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Contact Link (simple) */}
          <a href="#contact" className="nav-link">Contact</a>
        </div>
        
          {isSignedIn ? (
            <div className="user-profile">
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "user-avatar",
                    userButtonPopoverCard: "user-popover",
                    userButtonPopoverActions: "user-actions"
                  }
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Action 
                    label="My Profile" 
                    labelIcon={<FaInfoCircle />}
                    onClick={() => navigate("/profile")}
                  />
                  <UserButton.Action 
                    label="Settings"
                    onClick={() => navigate("/settings")}
                  />
                  <UserButton.Action label="Sign Out" />
                </UserButton.MenuItems>
              </UserButton>
              <span className="user-name">{user?.firstName || user?.username}</span>
            </div>
          ) : (
            <SignInButton mode="modal">
              <button className="sign-in-btn">
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </nav>
  );
}