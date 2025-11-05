// === app.js（患者フォーム）: 安定化パッチ ===
const APP_VER = 7;                            // ← 患者フォームのバージョン
const STORE_KEY = `grotti_patient_v${APP_VER}`;

function loadJSON(k, d=null){ try{ return JSON.parse(localStorage.getItem(k)) ?? d }catch{ return d } }
function saveJSON(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

function migrateLegacyIfNeeded() {
  // v6 以前のキーから自動移行（過去に保存した端末でも自動復旧）
  const legacy = loadJSON('grotti_patient') || loadJSON('grotti_patient_v6') || null;
  if (legacy && !loadJSON(STORE_KEY)) saveJSON(STORE_KEY, legacy);
}

function readUrlParams() {
  const p = new URLSearchParams(location.search);
  return {
    boot: p.get('boot') === '1',                     // ← これがあるとURL優先で上書き
    id: p.get('id') || '',
    supabaseUrl: p.get('supabaseUrl') || '',
    anonKey: p.get('anonKey') || '',
    reserveUrl: p.get('reserveUrl') || ''
  };
}

function mergeSettings() {
  migrateLegacyIfNeeded();

  const fromStore = loadJSON(STORE_KEY, { id:'', supabaseUrl:'', anonKey:'', reserveUrl:'' });
  const fromUrl = readUrlParams();

  // boot=1 のときは URL を優先して store を上書き
  const merged = (fromUrl.boot)
    ? {
        id: fromUrl.id || fromStore.id,
        supabaseUrl: fromUrl.supabaseUrl || fromStore.supabaseUrl,
        anonKey: fromUrl.anonKey || fromStore.anonKey,
        reserveUrl: fromUrl.reserveUrl || fromStore.reserveUrl
      }
    : fromStore;

  saveJSON(STORE_KEY, merged);             // 常に最新版を保存
  return merged;
}

function bindUI(){
  const $ = (s)=>document.querySelector(s);
  const st = mergeSettings();

  $('#patient-id').value = st.id || '';                 // 患者IDはQRから入る想定（読み取り専用でOK）
  $('#supabase-url').value = st.supabaseUrl || '';
  $('#supabase-anon').value = st.anonKey || '';
  $('#reserve-url').value = st.reserveUrl || '';

  // 端末へ保存
  $('#btn-save-local').addEventListener('click', ()=>{
    const nv = {
      id: $('#patient-id').value.trim(),
      supabaseUrl: $('#supabase-url').value.trim(),
      anonKey: $('#supabase-anon').value.trim(),
      reserveUrl: $('#reserve-url').value.trim()
    };
    saveJSON(STORE_KEY, nv);
    alert('この端末に保存しました');
  });

  // 再読み込み（保存値をフォームへ反映）
  $('#btn-reload-local').addEventListener('click', ()=>{
    const s = loadJSON(STORE_KEY, {});
    $('#patient-id').value   = s.id || '';
    $('#supabase-url').value = s.supabaseUrl || '';
    $('#supabase-anon').value= s.anonKey || '';
    $('#reserve-url').value  = s.reserveUrl || '';
  });

  // 初期ロード完了 → マスク非表示
  const mask = document.getElementById('boot-mask');
  if (mask) mask.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', bindUI);
