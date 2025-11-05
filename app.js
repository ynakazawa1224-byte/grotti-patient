<script>
/** ===== 患者アプリ 初期化 & 永続化 ===== */

const LS_KEYS = {
  patientId: 'gp.patientId',
  supabaseUrl: 'gp.supabaseUrl',
  anonKey:    'gp.anonKey',
  reserveUrl: 'gp.reserveUrl',
  savedAt:    'gp.savedAt',
};

// フォーム要素
const $id        = document.querySelector('#patient-id');
const $url       = document.querySelector('#supabase-url');
const $anon      = document.querySelector('#supabase-anon');
const $reserve   = document.querySelector('#reserve-url');
const $saveBtn   = document.querySelector('#btn-save-local');
const $reloadBtn = document.querySelector('#btn-reload-local');
const $badges    = {
  headerId:  document.querySelector('#badge-header-id'),
  headerSb:  document.querySelector('#badge-header-sb'),
  headerRes: document.querySelector('#badge-header-res'),
};

// util
const setReadonly = (el, ro) => { if (el) el.readOnly = !!ro; };
const setValue    = (el, v)  => { if (el) el.value = (v ?? ''); };
const getValue    = (el)     => (el ? el.value.trim() : '');

// 画面ヘッダのバッジを更新
function updateBadges() {
  const pid = getValue($id);
  const hasSb = getValue($url) && getValue($anon);
  const hasRes = !!getValue($reserve);

  if ($badges.headerId)  $badges.headerId.textContent  = pid || '未設定';
  if ($badges.headerSb)  $badges.headerSb.textContent  = hasSb ? 'OK' : '未設定';
  if ($badges.headerRes) $badges.headerRes.textContent = hasRes ? '登録済' : '未登録';
}

// localStorage ←→ フォーム
function loadFromLocal() {
  const pid = localStorage.getItem(LS_KEYS.patientId) || '';
  const sb  = localStorage.getItem(LS_KEYS.supabaseUrl) || '';
  const ak  = localStorage.getItem(LS_KEYS.anonKey) || '';
  const rv  = localStorage.getItem(LS_KEYS.reserveUrl) || '';

  setValue($id, pid);
  setValue($url, sb);
  setValue($anon, ak);
  setValue($reserve, rv);

  // IDが空なら手入力を許可、入っていれば読み取り専用
  setReadonly($id, !!pid);
  updateBadges();
}

function saveToLocal() {
  localStorage.setItem(LS_KEYS.patientId,  getValue($id));
  localStorage.setItem(LS_KEYS.supabaseUrl, getValue($url));
  localStorage.setItem(LS_KEYS.anonKey,    getValue($anon));
  localStorage.setItem(LS_KEYS.reserveUrl, getValue($reserve));
  localStorage.setItem(LS_KEYS.savedAt,    String(Date.now()));
  updateBadges();
  alert('この端末に保存しました。');
}

function applyFromQueryOnce() {
  const sp = new URLSearchParams(location.search);
  const hasAny =
    sp.has('id') || sp.has('patientId') ||
    sp.has('supabaseUrl') || sp.has('anonKey') || sp.has('reserveUrl');

  if (!hasAny) return false;

  const pid = sp.get('patientId') || sp.get('id') || '';
  const sb  = sp.get('supabaseUrl') || '';
  const ak  = sp.get('anonKey') || '';
  const rv  = sp.get('reserveUrl') || sp.get('reserve') || '';

  if (pid) setValue($id, pid);
  if (sb)  setValue($url, sb);
  if (ak)  setValue($anon, ak);
  if (rv)  setValue($reserve, rv);

  // 反映したら端末に保存しておく
  saveToLocal();
  // IDが入ったら以後は誤編集防止でロック
  setReadonly($id, !!pid);
  updateBadges();
  return true;
}

function init() {
  // 1) クエリがあれば画面へ反映 → 保存
  const taken = applyFromQueryOnce();

  // 2) クエリが無い（=ホームアイコン起動など）なら localStorage から復元
  if (!taken) loadFromLocal();

  // ボタン類
  if ($saveBtn)   $saveBtn.addEventListener('click', saveToLocal);
  if ($reloadBtn) $reloadBtn.addEventListener('click', () => {
    loadFromLocal();
    alert('保存済みの設定を再読み込みしました。');
  });

  // 入力変化時にバッジ更新
  [$id, $url, $anon, $reserve].forEach(el => {
    if (el) el.addEventListener('input', updateBadges);
  });

  // iOS PWA のキャッシュ対策：バージョン付きで1度だけ登録
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js?v=6');
    }
  } catch (_) {}
}

document.addEventListener('DOMContentLoaded', init);
</script>
