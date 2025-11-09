// supabaseClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export function getSupabase() {
  const url = localStorage.getItem("gp.supabaseUrl");
  const key = localStorage.getItem("gp.anonKey");
  if (!url || !key) throw new Error("Supabase設定が見つかりません。設定画面でURLとKeyを保存してください。");
  return createClient(url, key);
}
