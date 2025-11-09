// app.js  — 患者入力フォーム（完全版）
// -------------------------------------------------------------
// 依存: supabaseClient.js / savePatientInput.js / boot.js（任意）
// 目的: iOS Safari / PWA でも安定して動作する「保存」処理とUI制御
// -------------------------------------------------------------

import { getSupabase } from './supabaseClient.js';
import { savePatientInput } from './savePatientInput.js';

/* ------------------------ ユーティリティ ------------------------ */

// URLSearchParams から値を読む（null安全）
const qp = new URLSearchParams(location.search);
const q = (k) => (qp.get(k) ?? '').trim();

// Boot 情報の読み出し（boot.js が window.__BOOT を用意している前提。なければ URL から）
function readBoot() {
  const b = window.__BOOT ?? {};
  return {
    patientId: b.id || q('id') || q('pid') || '',
    supabaseUrl: b.supabaseUrl || q('supabaseUrl') || q('supaUrl') || '',
    anonKey: b.anonKey || q('anonKey') || q('supaKey') || '',
    reserveUrl: b.reserveUrl || q('reserveUrl') || '',
    // キャッシュバスター
    ts: b.ts || q('ts') || ''
  };
}

// DOM ヘルパ
const $ = (sel) => document.querySelector(sel);

// 数値パース（0〜10）
function parseNrs(v) {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ''));
  if (Number.isNaN(n)) return null;
  const clamped = Math.min(10, Math.max(0, n));
  return clamped;
}

// 短いトースト
function toast(msg) {
  alert(msg); // シンプルで互換性最強
}

// 予約リンクの可視化
function setReserveLink(url) {
  const a = $('#reserveLink');
  const text = $('#reserveText');
  if (!a || !text) return;
  if (url) {
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    text.textContent = url;
  } else {
    a.removeAttribute('href');
    text.textContent = '未設定';
  }
}

// 入力値を集める
function collectForm() {
  const pid = ($('#pid')?.value ?? '').trim();
  const n24 = parseNrs($('#nrs24')?.value ?? '');
  const n48 = parseNrs($('#nrs48')?.value ?? '');
  const comment = ($('#comment')?.value ?? '').trim();
  return { pid, n24, n48, comment };
}

// 入力値をUIにセット
function fillForm({ patientId, reserveUrl }) {
  if ($('#pid')) $('#pid').value = patientId || '';
  setReserveLink(reserveUrl || '');
}

// タブ制御（データ属性 data-tab="input|reserve|profile"）
function setupTabs() {
  const buttons = document.querySelectorAll('[data-tab]');
  const panels = document.querySelectorAll('[data-panel]');
  const activate = (name) => {
    panels.forEach(p => p.style.display = (p.dataset.panel === name ? '' : 'none'));
    buttons.forEach(b => {
      if (b.dataset.tab === name) b.classList.add('active');
      else b.classList.remove('active');
    });
  };
  buttons.forEach(btn => btn.addEventListener('click', () => activate(btn.dataset.tab)));
  // 既定は input
  activate('input');
}

// 「保存」ボタン状態
function setSaving(flag) {
  const btn = $('#saveBtn');
  if (!btn) return;
  btn.disabled = !!flag;
  btn.textContent = flag ? '保存中…' : '保存する';
}

/* ------------------------ メイン初期化 ------------------------ */

async function main() {
  // 1) Boot情報取得
  const boot = readBoot();

  // 2) UIへの反映
  fillForm(boot);
  setupTabs();

  // 3) Supabase クライアント準備（URL/Key が欠けている場合は保存ボタン押下時に警告）
  let supabase = null;
  if (boot.supabaseUrl && boot.anonKey) {
    try {
      supabase = getSupabase(boot.supabaseUrl, boot.anonKey);
    } catch (e) {
      console.error('Supabase init error:', e);
    }
  }

  // 4) クリア
  $('#clearBtn')?.addEventListener('click', () => {
    if ($('#nrs24')) $('#nrs24').value = '';
    if ($('#nrs48')) $('#nrs48').value = '';
    if ($('#comment')) $('#comment').value = '';
    toast('入力をクリアしました。');
  });

  // 5) 保存
  $('#saveBtn')?.addEventListener('click', async () => {
    const { pid, n24, n48, comment } = collectForm();

    // フロント検証
    if (!pid) return toast('患者IDが空です。QRコードから開いてください。');
    if (n24 == null && n48 == null && !comment) {
      return toast('保存できる内容がありません。NRSまたはコメントを入力してください。');
    }
    if (!boot.supabaseUrl || !boot.anonKey) {
      return toast('保存先の設定が不足しています（SupabaseURL / anonKey）。管理者へ連絡してください。');
    }
    if (!supabase) {
      try {
        supabase = getSupabase(boot.supabaseUrl, boot.anonKey);
      } catch (e) {
        console.error(e);
        return toast('保存先の初期化に失敗しました。');
      }
    }

    // 保存実行
    setSaving(true);
    try {
      const res = await savePatientInput({
        supabase,
        patient_id: pid,
        nrs24: n24,
        nrs48: n48,
        comment: comment || '',
      });
      if (res.error) {
        console.error(res.error);
        toast('保存に失敗しました。電波状況を確認し、再度お試しください。');
      } else {
        // 成功
        if ($('#nrs24')) $('#nrs24').value = '';
        if ($('#nrs48')) $('#nrs48').value = '';
        if ($('#comment')) $('#comment').value = '';
        toast('保存しました。ご協力ありがとうございます。');
      }
    } catch (err) {
      console.error(err);
      toast('保存中にエラーが発生しました。');
    } finally {
      setSaving(false);
    }
  });

  // 6) Enter キーで保存
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && !ev.isComposing) {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        ev.preventDefault();
        $('#saveBtn')?.click();
      }
    }
  });
}

// DOM 準備ができたら開始
document.addEventListener('DOMContentLoaded', () => {
  try {
    main();
  } catch (e) {
    console.error(e);
    toast('画面の初期化に失敗しました。');
  }
});
