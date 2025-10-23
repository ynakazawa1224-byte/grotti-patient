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

  const id = new URLSearchParams(location.search).get("id") || "";
  elPid.textContent = id ? `患者ID：${id}` : "患者IDが見つかりません";
  if (!id) return stop("患者IDがURLに含まれていません。QRコード（?id=XXXX）から開いてください。");
  if (!hasSupabase || !cfg.url || !cfg.key) return stop("設定が見つかりません。院側にお問い合わせください。");

  const sb = window.supabase.createClient(cfg.url, cfg.key);

  elSave.addEventListener("click", async () => {
    try {
      elSave.disabled = true; elMsg.textContent = "";
      const nrs24 = parseInt(el24.value, 10);
      const nrs48 = parseInt(el48.value, 10);
      const memo = (elMemo.value || "").trim();
      const ok24 = Number.isFinite(nrs24) && nrs24 >= 0 && nrs24 <= 10;
      const ok48 = Number.isFinite(nrs48) && nrs48 >= 0 && nrs48 <= 10;
      if (!ok24 && !ok48 && !memo) throw new Error("24h / 48h のいずれか、またはコメントのいずれかは入力してください。");

      const { error } = await sb.from("patient_nrs").insert({
        patient_id: id,
        nrs_24h: ok24 ? nrs24 : null,
        nrs_48h: ok48 ? nrs48 : null,
        memo: memo || null,
      });
      if (error) throw error;
      elMsg.innerHTML = '<span class="ok">保存しました。ご協力ありがとうございます。</span>';
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
