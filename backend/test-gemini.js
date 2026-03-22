import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testGemini() {
  const API_KEY = process.env.GEMINI_API_KEY;
  
  if (!API_KEY) {
    console.error('❌ No API key found in .env file');
    return;
  }
  
  console.log('🔑 Using API key:', API_KEY.substring(0, 15) + '...');
  console.log('🧪 Testing Gemini API...\n');
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
  
  const requestBody = {
    contents: [
      {
        parts: [{ text: "Say 'Hello from Gemini!' in one sentence." }]
      }
    ]
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      const text = data.candidates[0].content.parts[0].text;
      console.log('✅ Success!');
      console.log('Response:', text);
    } else {
      console.error('❌ API Error:', data.error?.message || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testGemini();