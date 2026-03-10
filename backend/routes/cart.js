const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Get cart for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (*)
      `)
      .eq('user_id', userId);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add item to cart
router.post('/', async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;
    // Check if item already exists
    const { data: existing } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user_id)
      .eq('product_id', product_id)
      .maybeSingle();

    if (existing) {
      // Update quantity
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
        .select();
      if (error) throw error;
      return res.json({ success: true, data: data[0] });
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('cart_items')
        .insert([{ user_id, product_id, quantity }])
        .select();
      if (error) throw error;
      return res.json({ success: true, data: data[0] });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update cart item quantity
router.put('/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .select();
    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove item from cart
router.delete('/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear cart for a user
router.delete('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;