import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** null when the .env keys are missing – the app then runs fully on this device ("local mode"). */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key, { auth: { flowType: 'pkce' } }) : null;
export const cloudConfigured = !!supabase;
