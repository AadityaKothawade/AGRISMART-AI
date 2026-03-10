// routes/clerk.js
import express from 'express';
import supabase from '../config/supabase.js';

const router = express.Router();

// Simple endpoint to save user data
router.post('/save-user', async (req, res) => {
  console.log('\n📝 Save User Request Received');
  console.log('Body:', req.body);
  
  try {
    const { clerkId, email, firstName, lastName, profileImage } = req.body;
    
    // Validate required fields
    if (!clerkId || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'clerkId and email are required' 
      });
    }

    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0];

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    let result;

    if (existingUser) {
      // Update existing user
      console.log('User exists, updating...');
      const { data, error } = await supabase
        .from('users')
        .update({
          name: fullName,
          email: email,
          first_name: firstName || '',
          last_name: lastName || '',
          profile_image: profileImage || '',
          updated_at: new Date().toISOString()
        })
        .eq('clerk_id', clerkId)
        .select();

      if (error) throw error;
      result = data;
      console.log('✅ User updated');
    } else {
      // Insert new user
      console.log('Creating new user...');
      const { data, error } = await supabase
        .from('users')
        .insert([{
          clerk_id: clerkId,
          name: fullName,
          email: email,
          first_name: firstName || '',
          last_name: lastName || '',
          profile_image: profileImage || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      result = data;
      console.log('✅ New user created');
    }

    res.json({ 
      success: true, 
      message: 'User saved successfully',
      data: result 
    });

  } catch (error) {
    console.error('❌ Error saving user:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Clerk routes working' });
});

export default router;