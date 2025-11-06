/* assets/boot.js - v3 (#pid優先) */
(function(){
  const sp = new URLSearchParams(location.search);
  const boot = sp.get('boot');
  const id   = (sp.get('id') || '').trim();

  function setStatus(msg, ok){
    const el = document.getElementById('boot-status');
    if (el) {
      el.textContent = msg;
      el.style.color = ok ? '#065' : '#933';
    }
  }

  // boot=1 のとき設定を v3 へ保存（旧キーにもミラー）
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

  window.addEventListener('DOMContentLoaded', () => {
    // ★ 優先順：#pid → #patient-id → #profPid → input[name="patient_id"]
    const targets = [
      document.querySelector('#pid'),
      document.querySelector('#patient-id'),
      document.querySelector('#profPid'),
      document.querySelector('input[name="patient_id"]'),
    ].filter(Boolean);

    if (targets.length && id) {
      targets.forEach(inp => {
        try { inp.value = id; } catch(_) {}
        try { inp.readOnly = true; } catch(_) {}
      });
    }

    // ステータス表示の更新
    const raw = localStorage.getItem('grotti_settings_v3');
    const cfg = raw ? JSON.parse(raw) : null;
    if (cfg?.supabaseUrl && cfg?.anonKey) {
      setStatus('設定読み込み完了（v3）', true);
    } else {
      setStatus('設定が読み込めませんでした', false);
    }
  });
})();
