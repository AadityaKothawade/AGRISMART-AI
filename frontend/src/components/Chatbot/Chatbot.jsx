// components/Chatbot/Chatbot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useLanguage } from '../../contexts/LanguageContext';
import './Chatbot.css';

// Simple SVG Icons (unchanged)
const RobotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    <line x1="8" y1="17" x2="16" y2="17"></line>
    <circle cx="9" cy="15" r="1"></circle>
    <circle cx="15" cy="15" r="1"></circle>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const MinimizeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinner">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round"/>
  </svg>
);

const Chatbot = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [errorCount, setErrorCount] = useState(0);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchSuggestions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chatbot/suggestions`);
      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      } else {
        // Use translated fallback suggestions
        setSuggestions([
          t('suggestion_pest_control'),
          t('suggestion_best_fertilizer'),
          t('suggestion_organic_farming'),
          t('suggestion_gov_schemes')
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      // Translated fallback suggestions
      setSuggestions([
        t('suggestion_pest_control'),
        t('suggestion_best_fertilizer'),
        t('suggestion_organic_farming'),
        t('suggestion_gov_schemes')
      ]);
    }
  };

  const sendMessage = async (message = inputMessage) => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({ role: msg.role, content: msg.content }));
      const response = await axios.post(`${API_URL}/api/chatbot/chat`, {
        message: message,
        history: history
      });

      if (response.data.success) {
        const botMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.response,
          timestamp: response.data.timestamp || new Date().toISOString(),
        };
        setMessages(prev => [...prev, botMessage]);
        setErrorCount(0);
      } else {
        throw new Error(response.data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorMsg = t('error_message_chat');
      
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message === 'Network Error') {
        errorMsg = t('network_error');
      } else if (error.response?.status === 429) {
        errorMsg = t('too_many_requests');
        setErrorCount(prev => prev + 1);
      } else if (error.response?.status === 500) {
        errorMsg = t('server_error');
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <motion.button
          className="chatbot-toggle"
          onClick={() => setIsOpen(true)}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <RobotIcon />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`chatbot-window ${isMinimized ? 'minimized' : ''}`}
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            {/* Header */}
            <div className="chatbot-header">
              <div className="chatbot-header-info">
                <div className="header-icon">
                  <RobotIcon />
                </div>
                <div>
                  <h3>{t('ai_assistant')}</h3>
                  <p>{t('powered_by')}</p>
                </div>
              </div>
              <div className="chatbot-header-actions">
                {messages.length > 0 && (
                  <button
                    className="chatbot-clear"
                    onClick={clearMessages}
                    title={t('clear_chat')}
                  >
                    🗑️
                  </button>
                )}
                <button
                  className="chatbot-minimize"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  <MinimizeIcon />
                </button>
                <button
                  className="chatbot-close"
                  onClick={() => setIsOpen(false)}
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Messages Container */}
            {!isMinimized && (
              <>
                <div className="chatbot-messages">
                  {messages.length === 0 && (
                    <div className="chatbot-welcome">
                      <div className="welcome-icon">
                        <RobotIcon />
                      </div>
                      <h4>{t('welcome_greeting')}</h4>
                      <p>{t('welcome_message')}</p>
                      <ul>
                        <li>{t('crop_management')}</li>
                        <li>{t('pest_control')}</li>
                        <li>{t('irrigation')}</li>
                        <li>{t('market_prices')}</li>
                        <li>{t('gov_schemes_chat')}</li>
                      </ul>
                      <div className="feature-badge">
                        <span>✨ {t('powered_by')}</span>
                      </div>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message ${message.role === 'user' ? 'user-message' : 'bot-message'} ${message.isError ? 'error-message' : ''}`}
                    >
                      <div className="message-avatar">
                        {message.role === 'user' ? '👤' : <RobotIcon />}
                      </div>
                      <div className="message-content">
                        <div className="message-text">{message.content}</div>
                        <div className="message-time">{formatTime(message.timestamp)}</div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="message bot-message">
                      <div className="message-avatar">
                        <RobotIcon />
                      </div>
                      <div className="message-content">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Suggestions */}
                {messages.length === 0 && suggestions.length > 0 && (
                  <div className="chatbot-suggestions">
                    <p>{t('try_asking')}</p>
                    <div className="suggestions-grid">
                      {suggestions.slice(0, 6).map((suggestion, index) => (
                        <button
                          key={index}
                          className="suggestion-btn"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="chatbot-input-area">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('type_message')}
                    rows="1"
                  />
                  <button
                    className="send-btn"
                    onClick={() => sendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                  >
                    {isLoading ? <SpinnerIcon /> : <SendIcon />}
                  </button>
                </div>
                
                {/* Rate Limit Warning */}
                {errorCount > 3 && (
                  <div className="rate-limit-warning">
                    ⚠️ {t('rate_limit_warning')}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;