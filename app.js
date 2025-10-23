(function () {
  function readConfig() {
    const metaUrl = document.querySelector('meta[name="supabase-url"]')?.content?.trim();
    const metaKey = document.querySelector('meta[name="supabase-anon-key"]')?.content?.trim();
    if (metaUrl && metaKey) return { url: metaUrl, key: metaKey, source: "meta" };
    const lsUrl = localStorage.getItem("SUPABASE_URL") || "";
    const lsKey = localStorage.getItem("SUPABASE_ANON_KEY") || "";
    if (lsUrl && lsKey) return { url: lsUrl, key: lsKey, source: "localStorage" };
    return { url: "", key: "", source: "missing" };
  }

  // 日本時間の今日(YYYY-MM-DD)
  function todayJstYmd() {
    const now = new Date();
    const jst = new Date(now.getTime() - now.getTimezoneOffset() * 60000); // ローカル→UTC補正を戻してISO
    return jst.toISOString().slice(0, 10);
  }

  // 0〜10の整数ならその値、違えば null
  function toNrsOrNull(v) {
    const n = parseInt(v, 10);
    if (!Number.isFinite(n)) return null;
    if (n < 0 || n > 10) return null;
    return n;
  }

  const elLib = document.getElementById("libState");
  const elUrl = document.getElementById("urlState");
  const elKey = document.getElementById("keyState");
  const elPid = document.getElementById("patientIdView");
  const el24 = document.getElementById("nrs24");
  const el48 = document.getElementById("nrs48");
  const elMemo = document.getElementById("memo");
  const elSave = document.getElementById("saveBtn");
  const elMsg = document.getElementById("saveMsg");

  const hasSupabase = !!window.supabase && !!window.supabase.createClient;
  elLib.textContent = hasSupabase ? "ライブラリ：OK" : "ライブラリ：未初期化";
  elLib.className = "pill " + (hasSupabase ? "green" : "red");

  const cfg = readConfig();
  elUrl.textContent = cfg.url ? "Project URL：OK" : "Project URL：未設定";
  elKey.textContent = cfg.key ? "Anon Key：OK" : "Anon Key：未設定";
  elUrl.className = "pill " + (cfg.url ? "green" : "red");
  elKey.className = "pill " + (cfg.key ? "green" : "red");

  // 患者ID（?id=XXXX）
  const id = new URLSearchParams(location.search).get("id") || "";
  elPid.textContent = id ? `患者ID：${id}` : "患者IDが見つかりません";
  if (!id) return stop("患者IDがURLに含まれていません。QRコード（?id=XXXX）から開いてください。");
  if (!hasSupabase || !cfg.url || !cfg.key) return stop("設定が見つかりません。院側にお問い合わせください。");

  const sb = window.supabase.createClient(cfg.url, cfg.key);

  elSave.addEventListener("click", async () => {
    try {
      elSave.disabled = true;
      elMsg.textContent = "";

      const nrs24 = toNrsOrNull(el24.value);
      const nrs48 = toNrsOrNull(el48.value);
      const memo = (elMemo.value || "").trim() || null;

      if (nrs24 === null && nrs48 === null && !memo) {
        throw new Error("24h / 48h のいずれか、またはコメントのいずれかは入力してください。");
      }

      const payload = {
        patient_id: id,
        date: todayJstYmd(),   // ★ NOT NULL の date を必ず送る（例: 2025-10-23）
        nrs_24h: nrs24,
        nrs_48h: nrs48,
        memo,
      };

      const { error } = await sb.from("patient_nrs").insert(payload);
      if (error) throw error;

      elMsg.innerHTML = '<span class="ok">保存しました。ご協力ありがとうございます。</span>';
      // 必要なら入力初期化
      // el24.value = ""; el48.value = ""; elMemo.value = "";
    } catch (e) {
      console.error(e);
      elMsg.innerHTML = `<span class="err">${escapeHtml(e.message || String(e))}</span>`;
    } finally {
      elSave.disabled = false;
    }
  });

  function stop(msg) {
    el24.disabled = true; el48.disabled = true; elMemo.disabled = true; elSave.disabled = true;
    elMsg.innerHTML = `<span class="err">${escapeHtml(msg)}</span>`;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
})();
