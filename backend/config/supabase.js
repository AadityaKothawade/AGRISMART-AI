import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log("Supabase URL:", process.env.SUPABASE_URL);
console.log("URL:", process.env.SUPABASE_URL);
console.log("KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

export default supabase;