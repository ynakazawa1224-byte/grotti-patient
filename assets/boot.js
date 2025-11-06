/* assets/boot.js */
(function(){
  // 1) URLパラメータを読む
  const sp = new URLSearchParams(location.search);
  const boot = sp.get('boot');
  const id   = sp.get('id') || '';

  // 2) boot=1 のとき、Supabase設定を localStorage(v3) に保存（旧キーにもミラー）
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

  // 3) 患者IDをフォームに自動反映（id="patient-id" の input を想定）
  window.addEventListener('DOMContentLoaded', () => {
    const input = document.querySelector('#patient-id');
    if (input && id) {
      input.value = id;
      // 変更可能にしたいなら下をfalseに
      input.readOnly = true;
    }

    // 4) 「設定確認中…」表示を消す（id="boot-status" を想定）
    const s = document.querySelector('#boot-status');
    if (s) s.textContent = '設定読み込み完了';
  });
})();
