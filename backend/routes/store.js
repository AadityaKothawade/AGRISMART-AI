import express from 'express';
import supabase from '../config/supabase.js';

const router = express.Router();

// Get all store items (optionally filter by category)
router.get('/', async (req, res) => {
  const { category } = req.query;
  let query = supabase.from('store_items').select('*');
  if (category) query = query.eq('category', category);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// (Optional) Admin endpoints to add/update/delete store items
// ...

export default router;