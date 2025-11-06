/* assets/boot.js - v4 (robust: retry + MutationObserver) */
(function(){
  const sp   = new URLSearchParams(location.search);
  const boot = sp.get('boot');
  const id   = (sp.get('id') || '').trim();

  function setStatus(msg, ok){
    const el = document.getElementById('boot-status');
    if (el) {
      el.textContent = msg;
      el.style.color = ok ? '#065' : '#f88';
    }
  }

  // 1) boot=1 のとき設定を v3 に保存（旧キーにもミラー）
  if (boot === '1') {
    const payload = {
      supabaseUrl: (sp.get('supabaseUrl') || '').trim(),
      anonKey:     (sp.get('anonKey') || '').trim(),
      formUrl:     location.origin + location.pathname + (location.search.includes('v=') ? '' : '?v=7'),
      reserveUrl:  (sp.get('reserveUrl') || '').trim(),
      version: 3,
      ts: Date.now(),
    };
    try {
      localStorage.setItem('grotti_settings_v3', JSON.stringify(payload));
      localStorage.setItem('grotti_settings', JSON.stringify(payload));
      localStorage.setItem('grotti_settings_v2', JSON.stringify(payload));
      console.log('[boot] settings saved v3');
    } catch(e){ console.warn('[boot] save failed', e); }
  }

  // 2) IDを要素に反映（出現後にも再適用）
  function setPatientId(val){
    if (!val) return;
    const targets = [
      document.querySelector('#pid'),
      document.querySelector('#patient-id'),
      document.querySelector('#profPid'),
      document.querySelector('input[name="patient_id"]'),
    ].filter(Boolean);

    if (targets.length === 0) return false;

    targets.forEach(inp => {
      try { inp.value = val; } catch(_) {}
      try { inp.readOnly = true; } catch(_) {}
      // 以後、他コードで消されても再セットできるよう dataset に保持
      try { inp.dataset.__bootPinnedId = val; } catch(_) {}
    });
    return true;
  }

  // 3) 要素が後から追加・書き換えられてもIDを維持
  function startObservers(){
    // a) DOM変更を監視
    const mo = new MutationObserver(() => {
      // ピン止めされている値を復元
      const els = document.querySelectorAll('#pid, #patient-id, #profPid, input[name="patient_id"]');
      els.forEach(el => {
        const pinned = el && el.dataset && el.dataset.__bootPinnedId;
        if (pinned && el.value !== pinned) {
          try { el.value = pinned; } catch(_) {}
          try { el.readOnly = true; } catch(_) {}
        }
      });
      // まだ未設定なら初回セットも試す
      if (id) setPatientId(id);
    });
    mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true });

    // b) 念のためタイマーでも数回リトライ（描画順の差異対策）
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      setPatientId(id);
      if (tries >= 10) clearInterval(t); // 10回で十分
    }, 150);
  }

  window.addEventListener('DOMContentLoaded', () => {
    const raw = localStorage.getItem('grotti_settings_v3');
    const cfg = raw ? JSON.parse(raw) : null;
    if (cfg?.supabaseUrl && cfg?.anonKey) setStatus('設定読み込み完了', true);
    else setStatus('設定が読み込めませんでした', false);

    // 初回適用 & 監視開始
    if (id) setPatientId(id);
    startObservers();
  });
})();
