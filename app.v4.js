/* v4 全書き換え版：患者フォーム本体 */

// ---------- ユーティリティ ----------
const $ = (sel) => document.querySelector(sel);
const getNum = (el) => {
  const v = (el.value ?? '').trim();
  if (v === '') return null;         // 未入力は null
  const n = Number(v);
  if (!Number.isFinite(n)) return NaN;
  return n;
};

// クエリ取得（pid > id 優先）
function q(key) {
  const u = new URL(location.href);
  return u.searchParams.get(key);
}
function getPidFromQuery() {
  return q('pid') || q('id') || '';
}
function getConfigFromQuery() {
  return {
    supabaseUrl: q('supabaseUrl') || q('supaUrl') || '',
    anonKey:     q('anonKey')     || q('supaKey') || '',
    reserveUrl:  q('reserveUrl')  || ''
  };
}

// 設定（ローカル fallback）
function loadLocalSettings() {
  try {
    const raw = localStorage.getItem('grotti_patient_settings_v3');
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (_) { return {}; }
}

// トースト
function toast(msg) {
  alert(msg); // シンプルに（iOSホーム追加互換）
}

// タブ切替
function setupTabs() {
  const btns = document.querySelectorAll('.tabbtn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.querySelectorAll('[data-panel]').forEach(p => {
        p.style.display = (p.dataset.panel === tab) ? '' : 'none';
      });
    });
  });
}

// ---------- Supabase ----------
let supa = null;
async function createSupabaseIfPossible() {
  const viaQuery = getConfigFromQuery();
  const viaLocal = loadLocalSettings();
  const supabaseUrl = viaQuery.supabaseUrl || viaLocal.supabaseUrl || '';
  const anonKey     = viaQuery.anonKey     || viaLocal.anonKey     || '';

  // 予約リンクを反映
  const reserveUrl = viaQuery.reserveUrl || viaLocal.reserveUrl || '';
  const a = $('#reserveLink'); const t = $('#reserveText');
  if (reserveUrl) {
    a.href = reserveUrl; t.textContent = reserveUrl;
  } else {
    a.removeAttribute('href'); t.textContent = '未設定';
  }

  if (!supabaseUrl || !anonKey) return null;

  // ESMのため動的 import（iOS Safari 対応）
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false }
  });
}

// ---------- 保存処理 ----------
async function handleSave() {
  const pid = $('#pid').value.trim();
  if (!pid) { toast('患者IDが空です（QRが正しく読み込めていません）'); return; }

  const n24 = getNum($('#nrs24'));
  const n48 = getNum($('#nrs48'));
  const comment = $('#comment').value.trim();

  // 入力検証（空はOK／入っていたら0〜10整数）
  for (const [label, v] of [['24h NRS', n24], ['48h NRS', n48]]) {
    if (v === null) continue;
    if (!Number.isInteger(v) || v < 0 || v > 10) {
      toast(`${label} は 0〜10 の整数で入力してください。`);
      return;
    }
  }

  if (!supa) { toast('保存先(Supabase)の設定がありません。管理側で設定URL・鍵を見直してください。'); return; }

  try {
    const payload = {
      patient_id: pid,
      nrs24: (n24 === null ? null : n24),
      nrs48: (n48 === null ? null : n48),
      comment: comment || null,
    };
    const { error } = await supa.from('patient_nrs').insert(payload);
    if (error) throw error;

    toast('保存しました。ありがとうございました。');
    // 成功後クリアは好みで。ここではコメントだけ消す。
    // $('#comment').value = '';
  } catch (e) {
    console.error(e);
    toast('保存に失敗しました。通信状況と設定を確認してください。');
  }
}

// ---------- 初期化 ----------
(async function bootstrap() {
  setupTabs();

  // 患者IDの反映＆readOnly化
  const pid = getPidFromQuery();
  const pidInput = $('#pid');
  pidInput.value = pid;
  pidInput.readOnly = true;

  // Supabase 準備
  supa = await createSupabaseIfPossible();

  // クリア
  $('#clearBtn').addEventListener('click', () => {
    $('#nrs24').value = '';
    $('#nrs48').value = '';
    $('#comment').value = '';
  });

  // 保存ボタン / Enter保存
  $('#saveBtn').addEventListener('click', handleSave);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSave();
  });

  // 見た目だけロード完了感
  console.log('[patient] ready');
})();
