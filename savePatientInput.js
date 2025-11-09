// savePatientInput.js v4
// 期待テーブル: public.patient_nrs (columns: patient_id text, nrs24 int4 null, nrs48 int4 null, comment text null, created_at timestamptz default now())
export async function savePatientInput({ supabase, patient_id, nrs24, nrs48, comment }) {
  try {
    const payload = {
      patient_id,
      nrs24: (nrs24 ?? null),
      nrs48: (nrs48 ?? null),
      comment: comment ?? ''
    };
    const { error } = await supabase.from('patient_nrs').insert(payload);
    return { error: error ?? null };
  } catch (e) {
    return { error: e };
  }
}
