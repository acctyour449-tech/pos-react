import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// The error "Cannot set property fetch of #<Window>" often occurs when Supabase
// tries to polyfill fetch in environments where window.fetch is read-only.
// We provide the native fetch explicitly to prevent this.
export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey, 
  {
    global: {
      fetch: (input, init) => window.fetch(input, init),
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
