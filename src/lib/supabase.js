// Supabase client — wired with placeholder env vars.
// When you paste real REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY into .env,
// storage operations will mirror to Supabase. Until then, app works fine on localStorage alone.

import { createClient } from '@supabase/supabase-js';

const url = process.env.REACT_APP_SUPABASE_URL || '';
const key = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const hasSupabase = () => Boolean(url && key && url !== 'YOUR_SUPABASE_URL');

// Single shared workspace — "no login" decision means RLS should be open
// for a known anon table set. See supabase-schema.sql.
export const WORKSPACE = process.env.REACT_APP_WORKSPACE_ID || 'ajmeri-default';

// Stub when not configured — keeps imports working
const stubClient = {
  from() {
    return {
      select: async () => ({ data: [], error: null }),
      insert: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
    };
  },
};

export const supa = hasSupabase() ? createClient(url, key) : stubClient;
