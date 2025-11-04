// app.js（患者ページ側 動作本体：フレームワーク非依存）

// --------------- ユーティリティ ---------------
function getLS(key, fallback = "") {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function setLS(key, val) {
  try { localStorage.setItem(key, val); } catch {}
}
function loadAllSettings() {
  return {
    patientId:  getLS("patientId"),
    supabaseUrl: getLS("supabaseUrl"),
    anonKey:    getLS("supabaseAnonKey"),
    reserveUrl: getLS("reserveUrl"),
  };
}
function updateStatusLine() {
  const s = loadAllSettings();
  const ok = !!(s.supabaseUrl && s.anonKey);
  const el = document.getElementById('statusLine');
  el.innerHTML = `患者ID: <strong>${s.patientId || "-"}</strong> ／ Supabase: ${
    ok ? '<span class="ok">設定OK</span>' : '<span class="ng">未設定</span>'
  } ／ 予約URL: ${s.reserveUrl ? '<span class="ok">あり</span>' : '<span class="ng">未登録</span>'}`;
}
function applyToInputs() {
  const s = loadAllSettings();
  // 入力タブ
  const pidEl = document.getElementById('pid');
  if (pidEl) pidEl.value = s.patientId || "";
  // プロフィール
  const pp = document.getElementById('profPid');
  const ps = document.getElementById('profSUrl');
  const pa = document.getElementById('profAKey');
  const pr = document.getElementById('profRUrl');
  if (pp) pp.value = s.patientId || "";
  if (ps) ps.value = s.supabaseUrl || "";
  if (pa) pa.value = s.anonKey || "";
  if (pr) pr.value = s.reserveUrl || "";
}

// --------------- タブ切替 ---------------
(function initTabs() {
  const tabInput = document.getElementById('tabInput');
  const tabReserve = document.getElementById('tabReserve');
  const tabProfile = document.getElementById('tabProfile');
  const vInput = document.getElementById('viewInput');
  const vReserve = document.getElementById('viewReserve');
  const vProfile = document.getElementById('viewProfile');

  function activate(which) {
    [tabInput, tabReserve, tabProfile].forEach(el => el.classList.remove('active'));
    [vInput, vReserve, vProfile].forEach(el => el.style.display = 'none');
    if (which === 'input')   { tabInput.classList.add('active');  vInput.style.display = 'block'; }
    if (which === 'reserve') { tabReserve.classList.add('active'); vReserve.style.display = 'block'; }
    if (which === 'profile') { tabProfile.classList.add('active'); vProfile.style.display = 'block'; }
  }
  tabInput.onclick = () => activate('input');
  tabReserve.onclick = () => activate('reserve');
  tabProfile.onclick = () => activate('profile');

  activate('input');
})();

// --------------- プロフィール保存／再読み込み ---------------
document.getElementById('btnProfSave').onclick = function() {
  const pid  = (document.getElementById('profPid').value || "").trim();
  const sUrl = (document.getElementById('profSUrl').value || "").trim();
  const aKey = (document.getElementById('profAKey').value || "").trim();
  const rUrl = (document.getElementById('profRUrl').value || "").trim();

  if (pid)  setLS("patientId", pid);
  if (sUrl) setLS("supabaseUrl", sUrl);
  if (aKey) setLS("supabaseAnonKey", aKey);
  if (rUrl) setLS("reserveUrl", rUrl);

  applyToInputs();
  updateStatusLine();
  alert("この端末に保存しました。");
};

document.getElementById('btnReload').onclick = function() {
  applyToInputs();
  updateStatusLine();
  alert("設定を再読み込みしました。");
};

// --------------- 予約ページオープン ---------------
document.getElementById('openReserve').onclick = function() {
  const rUrl = getLS("reserveUrl");
  if (!rUrl) { alert("予約URLが設定されていません。"); return; }
  window.open(rUrl, "_blank");
};

// 初期反映
applyToInputs();
updateStatusLine();

// --------------- 保存（Supabase REST 直叩き） ---------------
document.getElementById('btnSave').onclick = async function() {
  const s = loadAllSettings();
  if (!s.supabaseUrl || !s.anonKey) {
    alert("Supabaseの設定がこの端末にありません。QRコードから読み直すか、プロフィールで設定してください。");
    return;
  }
  if (!s.patientId) {
    alert("患者IDが未設定です。");
    return;
  }

  const nrs24 = document.getElementById('nrs24').value;
  const nrs48 = document.getElementById('nrs48').value;
  const memo  = document.getElementById('memo').value || null;

  // 0〜10に正規化（空はnull）
  const to01 = (v) => (v === "" ? null : Math.max(0, Math.min(10, Number(v))));

  const payload = {
    patient_id: s.patientId,
    nrs_24h: to01(nrs24),
    nrs_48h: to01(nrs48),
    memo
  };

  const url = s.supabaseUrl.replace(/\/+$/, "") + "/rest/v1/patient_nrs";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        apikey: s.anonKey,
        Authorization: "Bearer " + s.anonKey,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`HTTP ${res.status}: ${t}`);
    }
    document.getElementById('saveMsg').textContent = "✔ 保存しました。ご協力ありがとうございます。";
    setTimeout(()=>{ document.getElementById('saveMsg').textContent=""; }, 3000);
  } catch (e) {
    alert("保存できませんでした: " + e.message);
  }
};
