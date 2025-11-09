// savePatientInput.js
import { getSupabase } from "./supabaseClient.js";

export async function savePatientInput(data) {
  const supabase = getSupabase();
  const { error } = await supabase.from("patient_nrs").insert([data]);
  if (error) throw error;
  return true;
}
