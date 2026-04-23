// frontend/src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, SignInButton, UserButton } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaTractor, FaSeedling, FaFlask, FaChartLine, FaCloudSun,
  FaLeaf, FaChevronDown, FaInfoCircle, FaEnvelope, FaPhone,
  FaStore, FaShoppingCart, FaClipboardList, FaTachometerAlt
} from "react-icons/fa";
import { useLanguage } from "../contexts/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const { t } = useLanguage();
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const featuresRef = useRef(null);
  const aboutRef = useRef(null);

  const features = [
    { id: "soybean", title: t('soybean_analyzer'), description: t('soybean_desc'), icon: <FaSeedling />, path: "/soybean", color: "#10b981" },
    { id: "fertilizer", title: t('fertilizer_optimizer'), description: t('fertilizer_desc'), icon: <FaFlask />, path: "/fertilizer", color: "#3b82f6" },
    { id: "budget", title: t('budget_optimizer'), description: t('budget_desc'), icon: <FaChartLine />, path: "/budget", color: "#f59e0b" },
    { id: "weather", title: t('weather_insights'), description: t('weather_desc'), icon: <FaCloudSun />, path: "/weather", color: "#8b5cf6" }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (featuresRef.current && !featuresRef.current.contains(event.target)) setFeaturesOpen(false);
      if (aboutRef.current && !aboutRef.current.contains(event.target)) setAboutOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo" onClick={() => navigate("/")}>
          <FaTractor className="logo-icon" />
          <span className="logo-text">{t('app_name')}</span>
        </div>

        <div className="nav-right">
          <div className="nav-links">
            {/* Features Dropdown */}
            <div className="dropdown" ref={featuresRef}>
              <button className="dropdown-trigger" onClick={() => setFeaturesOpen(!featuresOpen)} onMouseEnter={() => setFeaturesOpen(true)}>
                <FaLeaf className="trigger-icon" />
                {t('features')}
                <FaChevronDown className={`chevron ${featuresOpen ? 'open' : ''}`} />
              </button>
              <AnimatePresence>
                {featuresOpen && (
                  <motion.div className="dropdown-menu features-menu" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onMouseLeave={() => setFeaturesOpen(false)}>
                    {features.map((feature) => (
                      <motion.div key={feature.id} className="feature-item" onClick={() => { navigate(feature.path); setFeaturesOpen(false); }} whileHover={{ x: 5 }}>
                        <div className="feature-icon" style={{ color: feature.color }}>{feature.icon}</div>
                        <div className="feature-info"><h4>{feature.title}</h4><p>{feature.description}</p></div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* About Dropdown */}
            <div className="dropdown" ref={aboutRef}>
              <button className="dropdown-trigger" onClick={() => setAboutOpen(!aboutOpen)} onMouseEnter={() => setAboutOpen(true)}>
                <FaInfoCircle className="trigger-icon" />
                {t('about')}
                <FaChevronDown className={`chevron ${aboutOpen ? 'open' : ''}`} />
              </button>
              <AnimatePresence>
                {aboutOpen && (
                  <motion.div className="dropdown-menu about-menu" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onMouseLeave={() => setAboutOpen(false)}>
                    <div className="about-section"><h4>{t('about')} {t('app_name')}</h4><p>Revolutionizing agriculture with cutting-edge AI technology...</p></div>
                    <div className="about-links">
                      <a href="#mission" className="about-link"><FaLeaf /> {t('our_mission')}</a>
                      <a href="#team" className="about-link"><FaInfoCircle /> {t('our_team')}</a>
                      <a href="#contact" className="about-link"><FaEnvelope /> {t('contact')}</a>
                      <a href="#phone" className="about-link"><FaPhone /> +1 (555) 123-4567</a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isSignedIn && (
              <>
                <a href="/dashboard" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
                  <FaTachometerAlt className="nav-link-icon" /> {t('dashboard')}
                </a>
                <a href="/marketplace" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/marketplace'); }}>
                  <FaStore className="nav-link-icon" /> {t('marketplace')}
                </a>
                <a href="/schemes" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/schemes'); }}>
                  <FaClipboardList className="nav-link-icon" /> {t('schemes')}
                </a>
                <a href="/my-orders" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/my-orders'); }}>
                  <FaShoppingCart className="nav-link-icon" /> {t('my_orders')}
                </a>
              </>
            )}
          </div>

          <LanguageSelector />

          {isSignedIn ? (
            <div className="user-profile">
              <UserButton afterSignOutUrl="/" />
              <span className="user-name">{user?.firstName || user?.username}</span>
            </div>
          ) : (
            <SignInButton mode="modal">
              <button className="sign-in-btn">{t('sign_in')}</button>
            </SignInButton>
          )}
        </div>
      </div>
    </nav>
  );
}