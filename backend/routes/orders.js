import express from 'express';
import supabase from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Create an order (buyer)
router.post('/', requireAuth, async (req, res) => {
  const { product_id, quantity } = req.body;
  const buyer_clerk_id = req.auth.userId;

  // 1. Check if product exists
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('quantity, clerk_id')
    .eq('id', product_id)
    .single();

  if (productError || !product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // 2. Prevent buying own product
  if (product.clerk_id === buyer_clerk_id) {
    return res.status(400).json({ error: 'You cannot buy your own product' });
  }

  // 3. Check if buyer exists in users table (foreign key constraint)
  const { data: buyer, error: buyerError } = await supabase
    .from('users')
    .select('clerk_id')
    .eq('clerk_id', buyer_clerk_id)
    .maybeSingle();

  if (!buyer) {
    return res.status(400).json({ 
      error: 'Buyer not registered in system. Please sign out and sign in again to sync your account.' 
    });
  }

  // 4. Create the order
  const { data, error } = await supabase
    .from('orders')
    .insert([{ 
      buyer_clerk_id, 
      product_id, 
      quantity, 
      status: 'pending' 
    }])
    .select();

  if (error) {
    console.error('Order insert error:', error);
    return res.status(400).json({ error: error.message });
  }

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
  const { data: products } = await supabase
    .from('products')
    .select('id')
    .eq('clerk_id', req.auth.userId);

  if (!products || products.length === 0) {
    return res.json({ success: true, data: [] });
  }

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

// Update order status (seller only) – with DEV bypass for test_user_123
// Update order status (seller only)
router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Allowed statuses
  const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  // Get order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('product_id')
    .eq('id', id)
    .single();

  if (orderError || !order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Get product owner
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('clerk_id')
    .eq('id', order.product_id)
    .single();

  if (productError || !product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Authorization check
  if (product.clerk_id !== req.auth.userId) {
    return res.status(403).json({ 
      error: `Not authorized. Product owner: ${product.clerk_id}, Your ID: ${req.auth.userId}`
    });
  }

  // Update status
  const { data, error } = await supabase
    .from('orders')
    .update({ status})
    .eq('id', id)
    .select();

  if (error) {
    console.error('Status update error:', error);
    return res.status(400).json({ error: error.message });
  }

  res.json({ success: true, data });
});

export default router;