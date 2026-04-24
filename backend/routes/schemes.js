import express from 'express';
import supabase from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public: get all schemes
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('schemes').select('*').order('last_date');
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// Admin only: create scheme
router.post('/', requireAuth, async (req, res) => {
  // optional: check user role = admin (see note below)
  const { scheme_name, description, eligibility, benefits, application_link, last_date } = req.body;
  const { data, error } = await supabase
    .from('schemes')
    .insert([{ scheme_name, description, eligibility, benefits, application_link, last_date }])
    .select();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// Admin only: update scheme
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { data, error } = await supabase
    .from('schemes')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// Admin only: delete scheme
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('schemes').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});


// Apply for a scheme (authenticated user)
router.post('/apply/:schemeId', requireAuth, async (req, res) => {
  const { schemeId } = req.params;
  const user_clerk_id = req.auth.userId;

  // Check if scheme exists
  const { data: scheme } = await supabase
    .from('schemes')
    .select('id')
    .eq('id', schemeId)
    .single();

  if (!scheme) return res.status(404).json({ error: 'Scheme not found' });

  // Insert application
  const { data, error } = await supabase
    .from('user_applied_schemes')
    .insert([{ user_clerk_id, scheme_id: schemeId }])
    .select();

  if (error) {
    if (error.code === '23505') { // unique violation
      return res.status(400).json({ error: 'You have already applied for this scheme' });
    }
    return res.status(400).json({ error: error.message });
  }

  res.json({ success: true, message: 'Application submitted successfully', data });
});

export default router;