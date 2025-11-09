// boot.js  — URLパラメータを安全に吸い上げて localStorage へ保存（恒久対策）
(function () {
  const ps = new URLSearchParams(location.search);
  const pick = (...keys) => keys.map(k => ps.get(k)).find(Boolean) || '';

  // 同義語も吸収（将来の表記ブレにも強く）
  const pid  = pick('id', 'pid');
  const sUrl = pick('supabaseUrl', 'supaUrl');
  const aKey = pick('anonKey', 'anon');
  const rUrl = pick('reserveUrl', 'reserve');

  if (pid)  localStorage.setItem('gp.pid', pid);
  if (sUrl) localStorage.setItem('gp.supabaseUrl', sUrl);
  if (aKey) localStorage.setItem('gp.anonKey', aKey);
  if (rUrl) localStorage.setItem('gp.reserveUrl', rUrl);

  console.log('[boot] settings saved v4');

  // PWA/SW は環境によってエラーになるので念のためガード
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(()=>{});
    }
  } catch {}
})();
