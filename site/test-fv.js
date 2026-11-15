/* テストページ(test-fv.html)専用: メインビュー。
   1問目の選択肢は、リンク(クリックすると、専用ページ test-fv-form.html へ移る)。ここでは、広告の流入元(UTM)を専用ページへ引き継ぎ、
   ヘッダーの申し込みボタンでフォームの位置へ動かす。 */
(function () {
  'use strict';
  var card = document.getElementById('fvform');
  if (!card) return;

  // 広告の流入元(UTM)は、main.js が sessionStorage に覚えている。専用ページでも同じものを読む。
  // 念のため、いまのURLにUTMがあれば、リンク先にも付ける。
  try {
    var p = new URLSearchParams(location.search), keep = [];
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) { if (p.get(k)) keep.push(k + '=' + encodeURIComponent(p.get(k))); });
    if (keep.length) Array.prototype.forEach.call(card.querySelectorAll('a.fv2__opt--link'), function (a) { a.href += '&' + keep.join('&'); });
  } catch (e) {}

  var ask = document.querySelector('.hd__ask');
  if (ask) ask.addEventListener('click', function (ev) {
    ev.preventDefault();
    var top = card.getBoundingClientRect().top + window.pageYOffset - 92;
    window.scrollTo({ top: top, behavior: 'smooth' });
  });
})();
