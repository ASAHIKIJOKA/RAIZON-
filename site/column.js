/* コラムのページ用: ヘッダーのメニュー開閉だけ(トップの main.js と同じ動き) */
(function () {
  var hd = document.getElementById('hd'), btn = document.getElementById('hdBtn');
  if (!hd || !btn) return;
  function setMenu(open) {
    hd.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  }
  btn.addEventListener('click', function () { setMenu(!hd.classList.contains('open')); });
  Array.prototype.slice.call(document.querySelectorAll('#hdPanel a')).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) setMenu(false); });
})();

/* 計測: 電話タップ・「相談する」ボタンのクリックを、GA4にイベントで送る */
(function () {
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a || !window.gtag) return;
    var h = a.getAttribute('href') || '';
    var loc = a.closest('.sp-cta') ? 'sp_bar' : a.closest('header') ? 'header' : a.closest('footer') ? 'footer' : a.closest('.cta') ? 'cta_section' : a.closest('.fv') ? 'first_view' : 'body';
    try {
      if (h.indexOf('tel:') === 0) window.gtag('event', 'click_tel', { cta_location: loc, page_path: location.pathname });
      else if (h.indexOf('#contact') > -1) window.gtag('event', 'click_contact_cta', { cta_location: loc, page_path: location.pathname });
    } catch (err) {}
  });
})();
