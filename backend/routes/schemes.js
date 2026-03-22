import express from 'express';
import supabase from '../config/supabase.js';

const router = express.Router();

// Get all government schemes
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('schemes')
    .select('*')
    .order('last_date', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

export default router;