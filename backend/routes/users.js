import express from 'express';
import supabase from '../config/supabase.js';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ success: true, data });
});

// Add user
router.post('/', async (req, res) => {
  const { name, email } = req.body;

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email }])
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ success: true, data });
});

export default router;