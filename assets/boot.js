/* assets/boot.js  — iOS/Safari/ホーム画面対策 + セーフモード + 入力無効化解除 */
(function () {
  const usp = new URLSearchParams(location.search);

  // --- 安全に全入力を有効化（何かにより disabled/readonly/pointer-events 無効でも復旧）---
  function enableAllInputs() {
    try {
      const root = document;
      root.querySelectorAll('input, textarea, select, button').forEach(el => {
        el.removeAttribute('disabled');
        el.removeAttribute('readonly');
        el.style.pointerEvents = 'auto';
      });
      // クリックガードがある場合に備えて
      root.querySelectorAll('[data-click-guard], .click-guard, .disabled-overlay')
        .forEach(n => n.remove());
    } catch (e) { console.warn(e); }
  }

  // --- iOS / PWA (ホーム画面) 検出 ---
  const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // --- iOSでズームやスクロールの誤作動を抑止 ---
  function fixViewport() {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    // ズーム抑制（フォーム操作時のフォーカスズーム対策）
    const content = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
    meta.setAttribute('content', content);
  }

  // --- iOS 15系の input focus スクロール対策（少し遅延してフォーカス）---
  function patchFocus() {
    document.addEventListener('focusin', e => {
      if (!isIOS) return;
      const el = e.target;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        setTimeout(() => {
          try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch {}
        }, 50);
      }
    });
  }

  // --- キャッシュバスター：&ts= を付けたアクセスなら、最新読み込みを強制（将来の再読込にも効かす）---
  (function enforceNoCache() {
    if (usp.get('ts')) {
      // 可能な限り古いキャッシュを避ける
      try {
        if ('caches' in window) caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      } catch {}
    }
  })();

  // --- セーフモード：&safe=1 で強制操作可能化 ---
  if (usp.get('safe') === '1') {
    document.addEventListener('DOMContentLoaded', enableAllInputs);
  }

  // --- 常時：起動時に入力を確実に有効化 ---
  document.addEventListener('DOMContentLoaded', () => {
    enableAllInputs();
    if (isIOS) fixViewport();
    patchFocus();
    // 背面で pointer-events を潰すCSSがいたら回復
    const style = document.createElement('style');
    style.textContent = `
      * { -webkit-tap-highlight-color: rgba(0,0,0,0); }
      input, textarea, select, button { pointer-events:auto !important; }
    `;
    document.head.appendChild(style);
  });
})();
