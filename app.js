// app.js — DOMバインドを堅牢化（nullガード徹底）
(function () {
  const $  = (sel, root = document) => root.querySelector(sel);
  const get = (k) => localStorage.getItem(k) || '';
  const setIf = (sel, val) => { const el = $(sel); if (el != null) el.value = val; };
  const textIf = (sel, val) => { const el = $(sel); if (el != null) el.textContent = val; };

  function bindUI() {
    // 入力タブ（存在するものだけ初期化）
    setIf('#pid',    get('gp.pid'));
    setIf('#nrs24',  '');
    setIf('#nrs48',  '');
    setIf('#comment','');

    // プロフィール欄（フォームにあれば）
    setIf('#name',     get('gp.name'));
    setIf('#sex',      get('gp.sex'));
    setIf('#birthday', get('gp.birthday'));
    setIf('#phone',    get('gp.phone'));
    setIf('#email',    get('gp.email'));

    // 予約URLの案内などを出す場合（要素があれば）
    textIf('#reserveUrlHint', get('gp.reserveUrl'));
  }

  // 入力欄にフォーカス/ブラーでスクロールずれしにくくする軽い対策（存在チェック付き）
  function wireUXGuards() {
    ['#nrs24','#nrs48','#comment'].forEach(sel => {
      const el = $(sel);
      if (!el) return;
      el.addEventListener('focus', () => document.body.classList.add('kbd'));
      el.addEventListener('blur',  () => document.body.classList.remove('kbd'));
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    try { bindUI(); } catch (e) { console.error('bindUI failed', e); }
    try { wireUXGuards(); } catch {}
    document.body.classList.add('ready');
  });
})();
