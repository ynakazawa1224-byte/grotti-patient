// app.v4.js  — 患者入力フォーム本体（キャッシュ/旧SWを強制無効化）
// ---------------------------------------------------------------
import { getSupabase } from './supabaseClient.js';
import { savePatientInput } from './savePatientInput.js';

// 旧 service worker を強制解除（PWA/ホーム追加後の不整合対策）
try {
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) { try { await r.unregister(); } catch {} }
    // iOS Safari はSW未対応だが、他端末での残骸対策
  }
} catch {}

// ヘルパ
const $ = s => document.querySelector(s);
const qp = new URLSearchParams(location.search);
const q = k => (qp.get(k) ?? '').trim();

function readBoot() {
  const b = window.__BOOT ?? {};
  return {
    patientId: b.id || q('id') || q('pid') || '',
    supabaseUrl: b.supabaseUrl || q('supabaseUrl') || q('supaUrl') || '',
    anonKey: b.anonKey || q('anonKey') || q('supaKey') || '',
    reserveUrl: b.reserveUrl || q('reserveUrl') || '',
  };
}

function toast(m){ alert(m); }
function parseNrs(v){
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(/[^\d.-]/g,''));
  if (Number.isNaN(n)) return null;
  return Math.min(10, Math.max(0, n));
}

function setReserve(url){
  const a = $('#reserveLink'); const t = $('#reserveText');
  if (!a || !t) return;
  if (url){ a.href = url; a.target='_blank'; a.rel='noopener'; t.textContent = url; }
  else { a.removeAttribute('href'); t.textContent='未設定'; }
}

function setSaving(b){
  const btn = $('#saveBtn'); if (!btn) return;
  btn.disabled = !!b; btn.textContent = b ? '保存中…' : '保存する';
}

function setupTabs(){
  const btns = document.querySelectorAll('[data-tab]');
  const panes = document.querySelectorAll('[data-panel]');
  const act = name=>{
    panes.forEach(p=>p.style.display = (p.dataset.panel===name?'':'none'));
    btns.forEach(b=>b.classList.toggle('active', b.dataset.tab===name));
  };
  btns.forEach(b=>b.addEventListener('click', ()=>act(b.dataset.tab)));
  act('input');
}

document.addEventListener('DOMContentLoaded', async () => {
  const boot = readBoot();

  // UI初期化
  if ($('#pid')) $('#pid').value = boot.patientId || '';
  setReserve(boot.reserveUrl || '');
  setupTabs();

  let supabase = null;
  if (boot.supabaseUrl && boot.anonKey) {
    try { supabase = getSupabase(boot.supabaseUrl, boot.anonKey); } catch(e){ console.error(e); }
  }

  $('#clearBtn')?.addEventListener('click', ()=>{
    if ($('#nrs24')) $('#nrs24').value='';
    if ($('#nrs48')) $('#nrs48').value='';
    if ($('#comment')) $('#comment').value='';
    toast('入力をクリアしました。');
  });

  $('#saveBtn')?.addEventListener('click', async ()=>{
    const pid = ($('#pid')?.value ?? '').trim();
    const n24 = parseNrs($('#nrs24')?.value ?? '');
    const n48 = parseNrs($('#nrs48')?.value ?? '');
    const comment = ($('#comment')?.value ?? '').trim();

    if (!pid) return toast('患者IDが空です。QRコードから開いてください。');
    if (n24==null && n48==null && !comment) return toast('NRSまたはコメントを入力してください。');
    if (!boot.supabaseUrl || !boot.anonKey) return toast('保存先の設定（Supabase）が不足しています。管理者へご連絡ください。');

    if (!supabase){
      try { supabase = getSupabase(boot.supabaseUrl, boot.anonKey); }
      catch(e){ console.error(e); return toast('保存先の初期化に失敗しました。'); }
    }

    setSaving(true);
    try {
      const { error } = await savePatientInput({
        supabase,
        patient_id: pid, nrs24: n24, nrs48: n48, comment
      });
      if (error){ console.error(error); toast('保存に失敗しました。通信状況をご確認ください。'); }
      else{
        if ($('#nrs24')) $('#nrs24').value=''; if ($('#nrs48')) $('#nrs48').value=''; if ($('#comment')) $('#comment').value='';
        toast('保存しました。ご協力ありがとうございます。');
      }
    } catch(e){ console.error(e); toast('保存中にエラーが発生しました。'); }
    finally { setSaving(false); }
  });

  // Enterでも保存
  document.addEventListener('keydown', e=>{
    if (e.key==='Enter' && !e.isComposing){
      if (document.activeElement && ['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){
        e.preventDefault(); $('#saveBtn')?.click();
      }
    }
  });
});
