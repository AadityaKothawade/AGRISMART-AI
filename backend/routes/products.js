import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import supabase from '../config/supabase.js';

const router = express.Router();

// Get all products (for buyers) - NO AUTH REQUIRED
router.get('/', async (req, res) => {
  try {
    const { category, location } = req.query;
    let query = supabase
      .from('products')
      .select(`
        *,
        users!products_farmer_id_fkey (
          first_name, 
          last_name, 
          profile_image
        )
      `);
    
    if (category) query = query.eq('category', category);
    if (location) query = query.ilike('location', `%${location}%`);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get farmer's own products - AUTH REQUIRED
router.get('/my-products', requireAuth, async (req, res) => {
  try {
    console.log('Fetching products for user:', req.userId);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('farmer_id', req.userId);
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Add product - AUTH REQUIRED
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, price, quantity, category, image_url, location } = req.body;
    
    // Validate required fields
    if (!name || !price || !quantity || !category || !location) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    const { data, error } = await supabase
      .from('products')
      .insert([{
        farmer_id: req.userId,
        name,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        category,
        image_url: image_url || null,
        location
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
    
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update product - AUTH REQUIRED
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check ownership
    const { data: existing, error: checkError } = await supabase
      .from('products')
      .select('farmer_id')
      .eq('id', id)
      .single();
    
    if (checkError) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }
    
    if (existing.farmer_id !== req.userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have permission to edit this product' 
      });
    }
    
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete product - AUTH REQUIRED
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check ownership
    const { data: existing, error: checkError } = await supabase
      .from('products')
      .select('farmer_id')
      .eq('id', id)
      .single();
    
    if (checkError) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }
    
    if (existing.farmer_id !== req.userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have permission to delete this product' 
      });
    }
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;