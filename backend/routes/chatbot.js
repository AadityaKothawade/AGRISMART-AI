import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const API_KEY = process.env.GEMINI_API_KEY;
// Using v1beta for access to system instructions and latest models
const API_URL = 'https://generativelanguage.googleapis.com/v1beta';

// System prompt for agricultural assistant
const SYSTEM_PROMPT = `You are an agricultural AI assistant for AgriSmart AI, a smart farming platform. 
Your role is to help farmers and agricultural professionals with:
- Crop management and cultivation advice
- Pest and disease identification
- Fertilizer recommendations
- Weather impact on crops
- Sustainable farming practices
- Agricultural technology and tools
- Government schemes and subsidies
- Market prices and trends

Be friendly, professional, and provide practical, actionable advice. 
If asked about topics outside agriculture, politely redirect to agricultural topics.
Keep responses concise but informative (2-4 sentences when possible).
Use simple language that farmers can easily understand.`;

/**
 * Function to call Gemini API
 * Updated to use gemini-2.5-flash
 */
async function callGemini(userMessage, history = []) {
  // Swapped to the current stable Gemini 2.5 Flash model
  const url = `${API_URL}/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
  
  // Format history for the API (Gemini uses 'user' and 'model' roles)
  const contents = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Add the current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const requestBody = {
    // System instruction defines the AI's persona
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    }
  };
  
  console.log('📤 Sending request to Gemini 2.5 Flash...');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error Response:', errorText);
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No response content from Gemini API');
  }
  
  return text;
}

// Test endpoint
router.get('/test', async (req, res) => {
  try {
    if (!API_KEY) throw new Error('GEMINI_API_KEY is missing in .env');
    
    const response = await callGemini("Say 'AgriSmart AI is online!'");
    res.json({ success: true, message: 'Gemini is connected', response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Main chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    
    if (!message) return res.status(400).json({ success: false, error: 'Message is required' });

    // History should be last 10 messages to keep the context relevant
    const response = await callGemini(message, history.slice(-10));
    
    res.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Chat Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get suggested questions
router.get('/suggestions', (req, res) => {
  res.json({
    success: true,
    suggestions: [
      "How to control pests in soybean crops?",
      "What's the best fertilizer for wheat?",
      "Tell me about organic farming methods",
      "What government schemes are available for farmers?"
    ]
  });
});

export default router;