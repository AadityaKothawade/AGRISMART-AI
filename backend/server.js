// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/users.js';
import clerkRoutes from './routes/clerk.js';

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

// Handle preflight requests
app.options('*', cors());

// Important: Raw body parsing for Clerk webhook
app.use('/api/clerk/webhook', express.raw({ type: 'application/json' }));

// Regular JSON parsing for other routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/clerk', clerkRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AgriSmart AI API - Supabase Edition',
    status: 'running',
    endpoints: {
      users: '/api/users',
      clerk: '/api/clerk/webhook',
      health: '/'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: err.message 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🗄️  Database: Supabase PostgreSQL`);
  console.log('');
});