const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Farmer dashboard stats
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;

    // Get total products
    const { count: totalProducts, error: prodError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('farmer_id', farmerId);
    if (prodError) throw prodError;

    // Get orders containing farmer's products
    const { data: orderItems, error: orderError } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price_at_time,
        orders!inner (status)
      `)
      .eq('products.farmer_id', farmerId);
    if (orderError) throw orderError;

    const totalSales = orderItems.reduce((sum, item) => sum + (item.quantity * item.price_at_time), 0);
    const totalOrders = new Set(orderItems.map(item => item.order_id)).size;

    res.json({
      success: true,
      data: {
        totalProducts,
        totalSales,
        totalOrders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;