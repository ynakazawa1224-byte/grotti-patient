// supabaseClient.js v4
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export function getSupabase(url, anonKey) {
  if (!url || !anonKey) throw new Error('Supabase URL / anonKey missing');
  // 既存インスタンスがあれば再利用
  if (!window.__SB) window.__SB = {};
  const key = `${url}::${anonKey}`;
  if (!window.__SB[key]) window.__SB[key] = createClient(url, anonKey, {
    auth: { persistSession: false }
  });
  return window.__SB[key];
}
