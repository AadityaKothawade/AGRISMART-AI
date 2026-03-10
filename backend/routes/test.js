import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/test-auth', requireAuth, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Authentication working!', 
    userId: req.userId 
  });
});

export default router;