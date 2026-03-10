import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import supabase from '../config/supabase.js';

const router = express.Router();

// Create order (from cart)
router.post('/', requireAuth, async (req, res) => {
  const { items, totalAmount } = req.body; // items: array of { productId, quantity, priceAtTime }
  
  try {
    // Start a transaction (Supabase doesn't support multi-table transactions directly, but we can use RPC or handle sequentially)
    // For simplicity, we'll insert order and then items. If any fails, we need to manually clean up.
    
    // 1. Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        buyer_id: req.userId,
        total_amount: totalAmount,
        status: 'pending'
      }])
      .select()
      .single();
    
    if (orderError) throw orderError;
    
    // 2. Insert order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      price_at_time: item.priceAtTime
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    
    if (itemsError) {
      // Rollback: delete the order
      await supabase.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }
    
    // 3. Update product quantities (reduce stock)
    for (const item of items) {
      await supabase.rpc('decrement_product_quantity', { 
        product_id: item.productId, 
        quantity: item.quantity 
      });
    }
    
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get buyer's order history
router.get('/my-orders', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, image_url)
        )
      `)
      .eq('buyer_id', req.userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get farmer's sales (orders containing farmer's products)
router.get('/sales', requireAuth, async (req, res) => {
  try {
    // Get all order items where product.farmer_id = req.userId
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        *,
        orders!inner(buyer_id, created_at, status),
        products!inner(name, price, farmer_id)
      `)
      .eq('products.farmer_id', req.userId);
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;