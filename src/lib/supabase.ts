import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// The error "Cannot set property fetch of #<Window>" often occurs when Supabase
// tries to polyfill fetch in environments where window.fetch is read-only.
// We provide the native fetch explicitly to prevent this.
// We also ensure the client is only created if the URL is valid.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder', 
  {
    global: {
      fetch: (input, init) => window.fetch(input, init),
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);
