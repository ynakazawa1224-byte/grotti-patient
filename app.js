/* ============ 患者ページ 初期化 v7 (ID非依存・フェイルセーフ) ============ */

// ローカル保存キー
const LS = {
  pid: 'gp.patientId',
  url: 'gp.supabaseUrl',
  key: 'gp.anonKey',
  rsv: 'gp.reserveUrl',
  at : 'gp.savedAt',
};

// 要素探索（id / name / data-field / placeholder 日本語 で順に探す）
function findInput(candidates) {
  for (const sel of candidates) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}
function byPlaceholder(texts) {
  const all = Array.from(document.querySelectorAll('input,textarea'));
  return all.find(el => texts.some(t => (el.placeholder || '').includes(t))) || null;
}

// セレクタ定義（複数の当たり先を用意）
const el = {
  mask:  document.querySelector('#boot-mask') || null,
  id:    findInput([
            '#patient-id','#patientId','input[name="patientId"]','input[name="id"]',
            'input[data-field="patient-id"]'
         ]) || byPlaceholder(['患者ID','Patient ID']),
  url:   findInput([
            '#supabase-url','input[name="supabaseUrl"]','input[data-field="supabase-url"]'
         ]) || byPlaceholder(['Supabase URL','supabase']),
  key:   findInput([
            '#supabase-anon','input[name="anonKey"]','input[data-field="supabase-anon"]'
         ]) || byPlaceholder(['ANON','Anon','API KEY']),
  rsv:   findInput([
            '#reserve-url','input[name="reserveUrl"]','input[data-field="reserve-url"]'
         ]) || byPlaceholder(['予約URL','予約','reserve']),
  btnSave: document.querySelector('#btn-save-local') ||
           Array.from(document.querySelectorAll('button')).find(b => /この端末に保存/.test(b.textContent||'')) || null,
  btnReload: document.querySelector('#btn-reload-local') ||
             Array.from(document.querySelectorAll('button')).find(b => /再読み込み/.test(b.textContent||'')) || null,
  badgeId:  document.querySelector('#badge-header-id')  || null,
  badgeSb:  document.querySelector('#badge-header-sb')  || null,
  badgeRsv: document.querySelector('#badge-header-res') || null,
};

const $v = (elm, val) => {
  if (!elm) return '';
  if (val === undefined) return (elm.value ?? '').trim();
  elm.value = val ?? '';
};
const setRO = (elm, flag) => { if (elm && 'readOnly' in elm) elm.readOnly = !!flag; };

function showMask(on){ if (el.mask) el.mask.style.display = on ? '' : 'none'; }
function lockUI(on){
  document.querySelectorAll('button, input, select, textarea, a').forEach(n=>{
    if (!n) return;
    if (n === el.btnReload || n === el.btnSave) n.disabled = !!on; else n.disabled = !!on;
  });
}
function updateBadges(){
  if (el.badgeId)  el.badgeId.textContent  = $v(el.id)  || '未設定';
  if (el.badgeSb)  el.badgeSb.textContent  = ($v(el.url) && $v(el.key)) ? 'OK' : '未設定';
  if (el.badgeRsv) el.badgeRsv.textContent = $v(el.rsv) ? '登録済' : '未登録';
}

// ローカル保存/復元（要素が無い場合も例外にしない）
function loadLocal(){
  if (el.id)  $v(el.id,  localStorage.getItem(LS.pid) || $v(el.id));
  if (el.url) $v(el.url, localStorage.getItem(LS.url) || $v(el.url));
  if (el.key) $v(el.key, localStorage.getItem(LS.key) || $v(el.key));
  if (el.rsv) $v(el.rsv, localStorage.getItem(LS.rsv) || $v(el.rsv));
  setRO(el.id, !!(el.id && $v(el.id)));
  updateBadges();
}
function saveLocal(){
  if (el.id)  localStorage.setItem(LS.pid, $v(el.id));
  if (el.url) localStorage.setItem(LS.url, $v(el.url));
  if (el.key) localStorage.setItem(LS.key, $v(el.key));
  if (el.rsv) localStorage.setItem(LS.rsv, $v(el.rsv));
  localStorage.setItem(LS.at, String(Date.now()));
  updateBadges();
  try { alert('この端末に保存しました。'); } catch(_){}
}

// クエリ適用（あればローカル保存まで行う）
function applyFromQuery(){
  const sp = new URLSearchParams(location.search);
  const hit = ['id','patientId','supabaseUrl','anonKey','reserveUrl','reserve'].some(k => sp.has(k));
  if (!hit) return false;

  const pid = sp.get('patientId') || sp.get('id') || '';
  const sb  = sp.get('supabaseUrl') || '';
  const ak  = sp.get('anonKey') || '';
  const rv  = sp.get('reserveUrl') || sp.get('reserve') || '';

  if (el.id  && pid) $v(el.id,  pid);
  if (el.url && sb ) $v(el.url, sb );
  if (el.key && ak ) $v(el.key, ak );
  if (el.rsv && rv ) $v(el.rsv, rv );

  saveLocal();
  setRO(el.id, !!(el.id && pid));
  updateBadges();
  return true;
}

// Service Worker を v=7 で更新（失敗しても無視）
function updateSW(){
  try{
    if ('serviceWorker' in navigator){
      navigator.serviceWorker.register('./sw.js?v=7')
        .then(reg => { try{ reg.update && reg.update(); }catch(_){}})
        .catch(()=>{});
    }
  }catch(_){}
}

// 起動
function boot(){
  // 最悪でも 2.5 秒で UI を開放するセーフティ
  const safety = setTimeout(()=>{ showMask(false); lockUI(false); }, 2500);

  try{
    showMask(true);
    lockUI(true);

    const applied = applyFromQuery();
    if (!applied) loadLocal();
    updateSW();

  }catch(err){
    console.error('boot error', err);
  }finally{
    clearTimeout(safety);
    showMask(false);
    lockUI(false);
    updateBadges();
  }
}

// イベント
document.addEventListener('DOMContentLoaded', ()=>{
  boot();

  if (el.btnSave)   el.btnSave.addEventListener('click', saveLocal);
  if (el.btnReload) el.btnReload.addEventListener('click', ()=>{ loadLocal(); try{ alert('保存済み設定を再読み込みしました。'); }catch(_){}});

  [el.id, el.url, el.key, el.rsv].forEach(n => n && n.addEventListener('input', updateBadges));
});

// 予期せぬ例外でも UI を戻す
window.addEventListener('error', ()=>{ showMask(false); lockUI(false); });
window.addEventListener('unhandledrejection', ()=>{ showMask(false); lockUI(false); });
/* ================================ ここまで ================================ */
