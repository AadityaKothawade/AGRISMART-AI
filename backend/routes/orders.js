import express from 'express';
import supabase from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Create an order (buyer)
router.post('/', requireAuth, async (req, res) => {
  const { product_id, quantity } = req.body;
  const buyer_clerk_id = req.auth.userId;

  // Optional: check if product exists and has enough quantity
  const { data: product } = await supabase
    .from('products')
    .select('quantity, clerk_id')
    .eq('id', product_id)
    .single();

  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.clerk_id === buyer_clerk_id) {
    return res.status(400).json({ error: 'You cannot buy your own product' });
  }

  const { data, error } = await supabase
    .from('orders')
    .insert([{ buyer_clerk_id, product_id, quantity, status: 'pending' }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// Get orders placed by the logged‑in user (as buyer)
router.get('/my-orders', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      products (*)
    `)
    .eq('buyer_clerk_id', req.auth.userId)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// Get orders received for the farmer's products (as seller)
router.get('/received', requireAuth, async (req, res) => {
  // First get all product IDs of the farmer
  const { data: products } = await supabase
    .from('products')
    .select('id')
    .eq('clerk_id', req.auth.userId);

  if (!products || products.length === 0) return res.json({ success: true, data: [] });

  const productIds = products.map(p => p.id);
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      products (*)
    `)
    .in('product_id', productIds)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// Update order status (seller only)
router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Check if the order belongs to a product of this farmer
  const { data: order } = await supabase
    .from('orders')
    .select('product_id')
    .eq('id', id)
    .single();

  if (!order) return res.status(404).json({ error: 'Order not found' });

  const { data: product } = await supabase
    .from('products')
    .select('clerk_id')
    .eq('id', order.product_id)
    .single();

  if (!product || product.clerk_id !== req.auth.userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

export default router;  