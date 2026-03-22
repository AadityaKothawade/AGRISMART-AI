// frontend/src/components/Chatbot/Chatbot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './Chatbot.css';

// Simple SVG Icons
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
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      // Fallback suggestions if API fails
      setSuggestions([
        "How to control pests in soybean crops?",
        "What's the best fertilizer for wheat?",
        "Tell me about organic farming methods",
        "What government schemes are available for farmers?"
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
      // Prepare history for the API (exclude the current message we just added)
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Use the /chat endpoint which matches your backend
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
      
      let errorMsg = 'Sorry, I encountered an error. Please try again later.';
      
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message === 'Network Error') {
        errorMsg = 'Network error. Please check your internet connection.';
      } else if (error.response?.status === 429) {
        errorMsg = 'Too many requests. Please wait a moment and try again.';
        setErrorCount(prev => prev + 1);
      } else if (error.response?.status === 500) {
        errorMsg = 'Server error. Please try again in a few moments.';
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
                  <h3>AgriSmart AI Assistant</h3>
                  <p>Powered by Google Gemini 2.5 Flash</p>
                </div>
              </div>
              <div className="chatbot-header-actions">
                {messages.length > 0 && (
                  <button
                    className="chatbot-clear"
                    onClick={clearMessages}
                    title="Clear chat"
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
                      <h4>Hello! 👋</h4>
                      <p>
                        I'm your agricultural AI assistant powered by Google Gemini 2.5 Flash.
                        Ask me anything about:
                      </p>
                      <ul>
                        <li>🌾 Crop management</li>
                        <li>🐛 Pest control</li>
                        <li>💧 Irrigation techniques</li>
                        <li>📈 Market prices</li>
                        <li>🏛️ Government schemes</li>
                      </ul>
                      <div className="feature-badge">
                        <span>✨ Powered by Gemini 2.5 Flash</span>
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
                    <p>Try asking me:</p>
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
                    placeholder="Ask me anything about agriculture..."
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
                    ⚠️ You've hit the rate limit. Please wait a moment before sending more messages.
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