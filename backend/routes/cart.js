import express from 'express';
import supabase from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get user's cart
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`*, products(*)`)
    .eq('user_id', req.auth.userId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// Add to cart
router.post('/', requireAuth, async (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.auth.userId;

  // Check if exists
  const { data: existing } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', user_id)
    .eq('product_id', product_id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
      .select();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true, data: data[0] });
  } else {
    const { data, error } = await supabase
      .from('cart_items')
      .insert([{ user_id, product_id, quantity }])
      .select();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true, data: data[0] });
  }
});

// Update quantity
router.put('/:itemId', requireAuth, async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId)
    .select();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data: data[0] });
});

// Remove item
router.delete('/:itemId', requireAuth, async (req, res) => {
  const { itemId } = req.params;
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Clear cart
router.delete('/', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', req.auth.userId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

export default router;