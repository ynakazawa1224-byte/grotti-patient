// ====== 患者IDの管理（PWA/Safari両対応） ======
const LS_KEY = "gp_patient_id";

const $ = (sel) => document.querySelector(sel);
const pidView   = $("#pidView");
const idbar     = $("#idbar");
const idInput   = $("#idInput");
const idSaveBtn = $("#idSaveBtn");
const idHelp    = $("#idHelp");
const toast     = $("#toast");

function showToast(msg = "保存しました。") {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"), 1600);
}

function setPidDisplay(pid) {
  if (pid) {
    pidView.textContent = pid;
    pidView.style.background = "rgba(22,163,74,.15)";
    pidView.style.borderColor = "rgba(22,163,74,.35)";
    idbar.style.display = "none";
  } else {
    pidView.textContent = "（未設定）";
    pidView.style.background = "rgba(245,158,11,.15)";
    pidView.style.borderColor = "rgba(245,158,11,.35)";
    idbar.style.display = "block";
  }
}

function savePid(pid) {
  if (!pid) return;
  localStorage.setItem(LS_KEY, pid);
  setPidDisplay(pid);
  showToast("患者IDを保存しました（端末内）");
}

function loadPid() {
  // 1) URLパラメータ ?id= があれば最優先で保存
  const qs = new URLSearchParams(location.search);
  const fromUrl = qs.get("id");
  if (fromUrl && /^[A-Za-z0-9_-]+$/.test(fromUrl)) {
    savePid(fromUrl);
    return fromUrl;
  }
  // 2) 端末保存から復元
  const saved = localStorage.getItem(LS_KEY);
  setPidDisplay(saved);
  return saved || "";
}

// 初期化
let currentPid = loadPid();

// 未設定時のガイド
idSaveBtn?.addEventListener("click", () => {
  const v = (idInput?.value || "").trim();
  if (!v) { showToast("IDを入力してください"); return; }
  savePid(v);
  currentPid = v;
});
idHelp?.addEventListener("click", () => {
  alert(
`【IDのセット方法】
1) 院で渡されたQRを読み取ってこのページを開く
2) 画面上に「患者IDを保存」やID入力欄が出たら保存
3) 以後はホーム画面のアイコンから開けば自動復元されます`
  );
});

// ====== NRSの保存（既存ロジックに接続） ======
const saveBtn = $("#saveBtn");
saveBtn?.addEventListener("click", async () => {
  const n24 = parseInt($("#nrs24").value || "", 10);
  const n48 = parseInt($("#nrs48").value || "", 10);
  const memo = $("#memo").value || "";

  const pid = localStorage.getItem(LS_KEY) || currentPid;

  if (!pid) { showToast("患者IDが未設定です"); setPidDisplay(""); return; }
  if (Number.isNaN(n24) || n24 < 0 || n24 > 10) { showToast("24hは0〜10で入力"); return; }
  if (Number.isNaN(n48) || n48 < 0 || n48 > 10) { showToast("48hは0〜10で入力"); return; }

  try {
    // === ここは既存の Supabase への INSERT 関数に繋ぐだけ ===
    // すでに別箇所で supabase client を初期化済みであれば:
    // await sb.from("patient_nrs").insert({ patient_id: pid, nrs_24h: n24, nrs_48h: n48, memo });

    // 今はダミー成功トースト（既存保存が動いていればこの行は表示上書きされます）
    showToast("保存しました。ご協力ありがとうございます。");
  } catch (e) {
    console.error(e);
    showToast("保存に失敗しました");
  }
});

// PWA: サービスワーカー（初回だけ登録）
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
