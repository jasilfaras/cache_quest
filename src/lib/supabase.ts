import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

// Handle relative proxy URLs by prepending the current origin
const finalSupabaseUrl = supabaseUrl.startsWith('/')
    ? `${window.location.origin}${supabaseUrl === '/' ? '' : supabaseUrl}`
    : supabaseUrl;

export const supabase = createClient<Database>(finalSupabaseUrl, supabaseAnonKey);
