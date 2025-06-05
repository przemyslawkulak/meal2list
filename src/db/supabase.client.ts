import { createClient } from '@supabase/supabase-js';
import type { Database } from '@db/database.types';
import { environment } from '@env/environment';

const supabaseUrl = environment.supabaseUrl;
const supabaseAnonKey = environment.supabaseKey;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
export type SupabaseClient = typeof supabaseClient;
