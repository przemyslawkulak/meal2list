import { createClient } from '@supabase/supabase-js';

import type { Database } from './database.types';
import { environment } from '../environments/environment';

const supabaseUrl = environment.supabaseUrl;
const supabaseAnonKey = environment.supabaseKey;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = environment.defaultUser;
