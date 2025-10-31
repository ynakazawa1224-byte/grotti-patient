// app.js

// ① URLの ?id=... を最初に拾って localStorage に保存しておく
(function persistPatientIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const qId = params.get("id");
  if (qId) {
    localStorage.setItem("patientId", qId);
    // PWAで後から開いたときにも同じIDを見せたいので、?id= を削って履歴を置き換える
    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }
})();

// ② アプリの状態
const state = {
  tab: "input",
  patientId: localStorage.getItem("patientId") || "",
  supabaseUrl: localStorage.getItem("supabaseUrl") || "",
  supabaseAnon: localStorage.getItem("supabaseAnon") || "",
  reserveUrl: localStorage.getItem("reserveUrl") || "",
};

function saveSettingsToLocal() {
  localStorage.setItem("patientId", state.patientId || "");
  localStorage.setItem("supabaseUrl", state.supabaseUrl || "");
  localStorage.setItem("supabaseAnon", state.supabaseAnon || "");
  localStorage.setItem("reserveUrl", state.reserveUrl || "");
}

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1800);
}

function render() {
  const root = document.getElementById("app");
  const pidLabel = state.patientId ? state.patientId : "（未設定）";

  // タブ切り替え表示
  if (state.tab === "input") {
    root.innerHTML = `
      <div class="card">
        <div class="badge-inline">患者ID：${pidLabel}</div>
        <label>24時間後の痛み（0～10）</label>
        <input type="number" min="0" max="10" id="nrs24" placeholder="例: 5" inputmode="numeric" />
        <div class="small-hint">※0が痛みなし、10が最大の痛み</div>
        <label style="margin-top:12px;">48時間後の痛み（0～10）</label>
        <input type="number" min="0" max="10" id="nrs48" placeholder="例: 4" inputmode="numeric" />
        <label style="margin-top:12px;">コメント（任意）</label>
        <textarea id="memo" placeholder="気になることがあればご記入ください。"></textarea>
        <button id="saveBtn" class="btn-primary" style="margin-top:14px;">保存する</button>
        <p class="small-hint" style="margin-top:10px;">保存後は院側アプリに反映されます。</p>
      </div>
    `;
    document.getElementById("saveBtn").addEventListener("click", handleSaveNrs);
  }

  if (state.tab === "reserve") {
    const hasUrl = !!state.reserveUrl;
    root.innerHTML = `
      <div class="card">
        <div class="badge-inline">次回予約</div>
        ${
          hasUrl
            ? `<p class="small-hint">下のボタンから予約ページを開けます。</p>
               <button id="openReserve" class="btn-primary">予約ページを開く</button>`
            : `<p class="small-hint">この端末には予約URLがまだ保存されていません。</p>
               <p class="small-hint">院でQRを読み取り直すか、プロフィールで入力してください。</p>`
        }
      </div>
    `;
    const btn = document.getElementById("openReserve");
    if (btn) {
      btn.addEventListener("click", () => {
        window.open(state.reserveUrl, "_blank");
      });
    }
  }

  if (state.tab === "chat") {
    root.innerHTML = `
      <div class="card">
        <div class="badge-inline">相談メモ（試作）</div>
        <p class="small-hint">「前回のあとで少し戻りました」「次回こうしてほしい」などをメモできます。（今は端末内に保存）</p>
        <textarea id="chatMemo" placeholder="相談したい内容を入力してください。"></textarea>
        <button id="saveChat" class="btn-secondary" style="margin-top:12px;">この端末にメモする</button>
      </div>
    `;
    document.getElementById("saveChat").addEventListener("click", () => {
      const val = document.getElementById("chatMemo").value || "";
      localStorage.setItem("chatMemo", val);
      showToast("メモを保存しました");
    });
    // 以前のメモを表示
    const old = localStorage.getItem("chatMemo");
    if (old) {
      document.getElementById("chatMemo").value = old;
    }
  }

  if (state.tab === "profile") {
    root.innerHTML = `
      <div class="card">
        <div class="badge-inline">接続設定</div>
        <label>Supabase URL</label>
        <input type="url" id="profSupabaseUrl" placeholder="https://xxx.supabase.co" value="${state.supabaseUrl}" />
        <label style="margin-top:10px;">Supabase ANON KEY</label>
        <textarea id="profSupabaseAnon" placeholder="長いキー文字列">${state.supabaseAnon}</textarea>
        <label style="margin-top:10px;">予約URL（任意）</label>
        <input type="url" id="profReserveUrl" placeholder="https://line.me/R/xxxx" value="${state.reserveUrl}" />
        <label style="margin-top:10px;">患者ID（任意）</label>
        <input type="text" id="profPatientId" placeholder="P0001 など" value="${state.patientId}" />
        <button id="saveProfile" class="btn-primary" style="margin-top:14px;">この端末に保存する</button>
      </div>

      <div class="card">
        <p class="small-hint">この端末に保存されている設定</p>
        <p class="small-hint">患者ID：${pidLabel}</p>
        <p class="small-hint">予約URL：${state.reserveUrl ? state.reserveUrl : "（未設定）"}</p>
        <button id="resetProfile" class="btn-secondary" style="margin-top:10px;">この端末の設定をリセット</button>
      </div>
    `;
    document.getElementById("saveProfile").addEventListener("click", () => {
      state.supabaseUrl = document.getElementById("profSupabaseUrl").value.trim();
      state.supabaseAnon = document.getElementById("profSupabaseAnon").value.trim();
      state.reserveUrl = document.getElementById("profReserveUrl").value.trim();
      state.patientId = document.getElementById("profPatientId").value.trim();
      saveSettingsToLocal();
      showToast("設定を保存しました");
    });
    document.getElementById("resetProfile").addEventListener("click", () => {
      localStorage.removeItem("supabaseUrl");
      localStorage.removeItem("supabaseAnon");
      localStorage.removeItem("reserveUrl");
      // IDは残すかどうか迷うけど、今回は残す
      state.supabaseUrl = "";
      state.supabaseAnon = "";
      state.reserveUrl = "";
      render();
      showToast("この端末の設定を消去しました");
    });
  }

  // ボトムタブのactive切り替え
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    if (btn.dataset.tab === state.tab) btn.classList.add("active");
    else btn.classList.remove("active");
  });
}

// NRS保存ロジック
async function handleSaveNrs() {
  if (!state.supabaseUrl || !state.supabaseAnon) {
    showToast("Supabase設定がこの端末にありません");
    state.tab = "profile";
    render();
    return;
  }
  if (!state.patientId) {
    showToast("患者IDが未設定です");
    state.tab = "profile";
    render();
    return;
  }

  const nrs24 = parseInt(document.getElementById("nrs24").value || "0", 10) || 0;
  const nrs48 = parseInt(document.getElementById("nrs48").value || "0", 10) || 0;
  const memo = document.getElementById("memo").value || "";

  const payload = {
    patient_id: state.patientId,
    date: new Date().toISOString().slice(0, 10),
    nrs_24h: nrs24,
    nrs_48h: nrs48,
    memo: memo,
  };

  try {
    const res = await fetch(`${state.supabaseUrl}/rest/v1/patient_nrs`, {
      method: "POST",
      headers: {
        apikey: state.supabaseAnon,
        Authorization: `Bearer ${state.supabaseAnon}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn("Supabase error", await res.text());
      showToast("保存できませんでした");
      return;
    }

    showToast("保存しました");
    document.getElementById("nrs24").value = "";
    document.getElementById("nrs48").value = "";
    document.getElementById("memo").value = "";
  } catch (err) {
    console.error(err);
    showToast("通信エラーです");
  }
}

// 画面起動時
render();

// タブのクリックハンドラ
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.tab = btn.dataset.tab;
    render();
  });
});

// PWA用の簡易service worker登録
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => console.log(err));
  });
}
