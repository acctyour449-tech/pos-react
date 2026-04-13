import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use a custom fetch to avoid "Cannot set property fetch of #<Window>" error in restricted environments
const customFetch = (...args: any[]) => {
  return fetch(...(args as [any, any]));
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch,
  },
});
