import express from 'express';
import supabase from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all products (for buyers)
router.get('/', async (req, res) => {
  const { category, search } = req.query;
  let query = supabase.from('products').select('*');

  if (category) query = query.eq('category', category);
  if (search) query = query.ilike('product_name', `%${search}%`);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// Get products of the logged‑in farmer (for seller view)
router.get('/my-products', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('clerk_id', req.auth.userId)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// Add a new product
router.post('/', requireAuth, async (req, res) => {
  const { product_name, category, quantity, price, location, description, image_url } = req.body;
  const { data, error } = await supabase
    .from('products')
    .insert([{
      clerk_id: req.auth.userId,
      product_name,
      category,
      quantity,
      price,
      location,
      description,
      image_url
    }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// Update a product (only if owned by the farmer)
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Verify ownership
  const { data: existing } = await supabase
    .from('products')
    .select('clerk_id')
    .eq('id', id)
    .single();

  if (!existing || existing.clerk_id !== req.auth.userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// Delete a product
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  // Verify ownership
  const { data: existing } = await supabase
    .from('products')
    .select('clerk_id')
    .eq('id', id)
    .single();

  if (!existing || existing.clerk_id !== req.auth.userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

export default router;