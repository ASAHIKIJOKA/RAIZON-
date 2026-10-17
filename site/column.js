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
