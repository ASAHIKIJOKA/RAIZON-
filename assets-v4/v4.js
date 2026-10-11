// RAIZON サイト v4: スマホのメニュー開閉 / スクロールで表示 / お問い合わせフォームの送信
(function () {
  var tg = document.querySelector('.hd-tg'), nav = document.querySelector('.sp-nav');
  if (tg && nav) tg.addEventListener('click', function () {
    var o = nav.classList.toggle('open'); tg.setAttribute('aria-expanded', o ? 'true' : 'false');
  });

  var els = [].slice.call(document.querySelectorAll('.rv'));
  if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  // 流入元の記録(初回だけ)。お問い合わせメールに添える
  try {
    if (!localStorage.getItem('raizon_src')) {
      var p = new URLSearchParams(location.search), r = '';
      try { r = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
      localStorage.setItem('raizon_src', [p.get('utm_source') || r || 'direct', p.get('utm_medium') || '', p.get('utm_campaign') || '', location.pathname].join('|'));
    }
  } catch (e) {}

  var f = document.getElementById('cform');
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    var m = document.getElementById('fmsg'), d = {};
    new FormData(f).forEach(function (v, k) { d[k] = String(v).trim(); });
    if (!d.name || !d.email || !d.phone || !d.message) { m.style.color = '#C62828'; m.textContent = '必須項目を入力してください'; return; }
    try { d.source = localStorage.getItem('raizon_src') || ''; } catch (x) {}
    m.style.color = '#6B7280'; m.textContent = '送信しています…';
    fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
      .then(function (r) { if (!r.ok) throw new Error(); f.reset(); m.style.color = '#05A847'; m.textContent = '送信しました。2営業日以内にご連絡します。'; })
      .catch(function () { m.style.color = '#C62828'; m.textContent = '送信に失敗しました。LINEまたはお電話でご連絡ください。'; });
  });
})();
