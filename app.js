// 共通で使うキー
const STORAGE_KEY = "grotti_patient_settings";

// -----------------------------
// 初期ロード：URLパラメータを読む
// -----------------------------
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const reserve = params.get("reserve"); // つけるなら ?reserve=... 用
  return { id, reserve };
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function saveSettings(obj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

// URLに id= があればそれを保存
(function initFromUrl() {
  const { id, reserve } = getQueryParams();
  if (!id && !reserve) return;

  const current = loadSettings();
  const next = {
    ...current,
  };
  if (id) next.patientId = id;
  if (reserve) next.reserveUrl = reserve;

  saveSettings(next);
})();

// -----------------------------
// Supabase 保存処理
// -----------------------------
async function saveNrsToSupabase(patientId, nrs24, nrs48, memo) {
  // GitHub Pages 版は Supabase のURL/Keyを「埋め込まない」で運用したいので
  // 今回はあくまで「端末にSupabase設定が無い場合はエラー」のままにしておきます。
  // 将来的に「GitHub側に直書き」に変えるならここを固定値にします。
  const settings = loadSettings();

  const SUPABASE_URL = settings.supabaseUrl; // 今回のPWAではたぶん undefined になる想定
  const SUPABASE_KEY = settings.supabaseAnon;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    alert("Supabaseの設定がこの端末で見つかりません。院でQRをもう一度読み込んでください。");
    return;
  }

  const body = {
    patient_id: patientId,
    date: new Date().toISOString().substring(0, 10),
    nrs_24h: nrs24,
    nrs_48h: nrs48,
    memo: memo,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/patient_nrs`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("supabase error", err);
    alert("保存できませんでした。（院で設定を確認してください）");
    return;
  }

  alert("保存しました。ご協力ありがとうございます。");
}

// -----------------------------
// 画面反映
// -----------------------------
const inputTab = document.getElementById("tab-input");
const reserveTab = document.getElementById("tab-reserve");
const consultTab = document.getElementById("tab-consult");
const profileTab = document.getElementById("tab-profile");

const patientIdPill = document.getElementById("patient-id-pill");
const saveBtn = document.getElementById("save-nrs");
const nrs24Input = document.getElementById("nrs24");
const nrs48Input = document.getElementById("nrs48");
const memoInput = document.getElementById("memo");

const openReserveBtn = document.getElementById("open-reserve");
const copyReserveBtn = document.getElementById("copy-reserve");
const reserveHint = document.getElementById("reserve-hint");

const consultText = document.getElementById("consult-text");
const consultSave = document.getElementById("save-consult");
const consultStatus = document.getElementById("consult-status");

const profilePatientId = document.getElementById("profile-patient-id");
const profileReserveUrl = document.getElementById("profile-reserve-url");
const resetSettings = document.getElementById("reset-settings");

// 初期表示
function renderFromSettings() {
  const s = loadSettings();
  const pid = s.patientId || "（未設定）";
  patientIdPill.textContent = pid;
  profilePatientId.textContent = pid;

  const rurl = s.reserveUrl || "（未設定）";
  profileReserveUrl.textContent = rurl;

  // 予約タブのボタンの有効/無効
  if (!s.reserveUrl) {
    if (reserveHint)
      reserveHint.textContent = "この端末にはまだ予約URLが保存されていません。院でQRを読み込んでください。";
    if (openReserveBtn) openReserveBtn.disabled = true;
    if (copyReserveBtn) copyReserveBtn.disabled = true;
  } else {
    if (reserveHint) reserveHint.textContent = "この院の予約ページに移動します。";
    if (openReserveBtn) openReserveBtn.disabled = false;
    if (copyReserveBtn) copyReserveBtn.disabled = false;
  }

  // 相談メモ（ローカル）
  if (s.consultMemo) {
    consultText.value = s.consultMemo;
    consultStatus.textContent = "前回のメモを表示しています。";
  } else {
    consultStatus.textContent = "";
  }
}

renderFromSettings();

// -----------------------------
// タブ切り替え
// -----------------------------
const tabButtons = document.querySelectorAll(".tab-btn");
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;
    // ボタン側
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // body側
    document.querySelectorAll(".tab-body").forEach((el) => el.classList.remove("active"));

    if (target === "input") inputTab.classList.add("active");
    if (target === "reserve") reserveTab.classList.add("active");
    if (target === "consult") consultTab.classList.add("active");
    if (target === "profile") profileTab.classList.add("active");

    // 予約タブを開いた時点で、もう一回状態を同期しておく
    if (target === "reserve") {
      renderFromSettings();
    }
  });
});

// -----------------------------
// NRS 保存ボタン
// -----------------------------
if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    const s = loadSettings();
    const pid = s.patientId;

    if (!pid) {
      alert("患者IDが保存されていません。院でQRをもう一度読み込んでください。");
      return;
    }

    const n24 = Number(nrs24Input.value || 0);
    const n48 = Number(nrs48Input.value || 0);
    const memo = memoInput.value || "";

    // 0～10に丸め
    const v24 = Math.max(0, Math.min(10, n24));
    const v48 = Math.max(0, Math.min(10, n48));

    await saveNrsToSupabase(pid, v24, v48, memo);
  });
}

// -----------------------------
// 予約タブの処理
// -----------------------------
function getCurrentReserveUrl() {
  const s = loadSettings();
  return s.reserveUrl || "";
}

if (openReserveBtn) {
  openReserveBtn.addEventListener("click", () => {
    const url = getCurrentReserveUrl();
    if (!url) {
      alert("この端末に予約URLがありません。院でQRを再読み込みしてください。");
      return;
    }
    // まずは普通に開く。LINEでもだいたいこれで行きます
    window.location.href = url;
  });
}

if (copyReserveBtn) {
  copyReserveBtn.addEventListener("click", async () => {
    const url = getCurrentReserveUrl();
    if (!url) {
      alert("コピーできるURLがありません。");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      alert("予約URLをコピーしました。開かない場合はブラウザに貼り付けてください。");
    } catch (e) {
      alert("コピーに失敗しました。長押しでコピーしてください。");
    }
  });
}

// -----------------------------
// 相談タブ（ローカル保存）
// -----------------------------
if (consultSave) {
  consultSave.addEventListener("click", () => {
    const txt = consultText.value || "";
    const s = loadSettings();
    s.consultMemo = txt;
    saveSettings(s);
    consultStatus.textContent = "この端末に保存しました。";
  });
}

// -----------------------------
// プロフィールタブ：リセット
// -----------------------------
if (resetSettings) {
  resetSettings.addEventListener("click", () => {
    if (!confirm("この端末に保存した患者ID・予約URLを消しますか？")) return;
    localStorage.removeItem(STORAGE_KEY);
    renderFromSettings();
    alert("この端末の設定をリセットしました。もう一度QRを読み込んでください。");
  });
}

// -----------------------------
// PWA用 service worker （あれば）
// -----------------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((err) => console.warn("SW register failed", err));
  });
}
