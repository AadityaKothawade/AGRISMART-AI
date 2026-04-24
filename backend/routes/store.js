import express from 'express';
import supabase from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public: get all store items
router.get('/', async (req, res) => {
  const { category } = req.query;
  let query = supabase.from('store_items').select('*');
  if (category) query = query.eq('category', category);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// Admin: create store item
router.post('/', requireAuth, async (req, res) => {
  const { name, category, price, description, image_url, stock_quantity } = req.body;
  const { data, error } = await supabase
    .from('store_items')
    .insert([{ name, category, price, description, image_url, stock_quantity }])
    .select();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// Admin: update store item
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { data, error } = await supabase
    .from('store_items')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// Admin: delete store item
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('store_items').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

export default router;