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

// ===== v4.1: 動くデモ / 浮かぶ写真 / 縦スクロールで横に流れるカード / 横送り / 数字のカウント =====
(function () {
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1) 動くデモ(LINEの画面): メニュー → 予約 → 確定 → リマインド → クーポン を自動で繰り返す
  document.querySelectorAll('.demo').forEach(function (demo) {
    var chat = demo.querySelector('.chat'), tap = demo.querySelector('.tap'), sheet = demo.querySelector('.sheet');
    var cap = demo.parentNode.querySelector('.demo-cap');
    if (!chat || !tap || !sheet) return;
    var visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(demo);
    function wait(ms) { return new Promise(function (r) { (function w() { setTimeout(function () { visible ? r() : w(); }, visible ? ms : 400); })(); }); }
    function msg(html, cls) {
      var d = document.createElement('div'); d.className = 'm ' + (cls || ''); d.innerHTML = html; chat.appendChild(d);
      while (chat.children.length > 6) chat.removeChild(chat.firstChild);
      requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add('in'); }); }); return d;
    }
    function typing() { var t = msg('<span class="typing"><i></i><i></i><i></i></span>'); return wait(700).then(function () { t.remove(); }); }
    function tapAt(el, x, y) {
      var r = el.getBoundingClientRect(), s = demo.querySelector('.scr').getBoundingClientRect();
      tap.style.left = (r.left - s.left + r.width * x) + 'px'; tap.style.top = (r.top - s.top + r.height * y) + 'px';
      tap.classList.remove('go'); void tap.offsetWidth; tap.classList.add('go');
    }
    function caption(n, t) { if (!cap) return; cap.style.opacity = 0; setTimeout(function () { cap.innerHTML = '<b>' + n + '</b>' + t; cap.style.opacity = 1; }, 220); }
    var rm = demo.querySelector('.rmn');
    var CAR = '<div><b style="background:#8A7767">CUT</b><span>レディース<em>¥5,500</em></span><span>メンズ<em>¥4,400</em></span></div><div><b style="background:#B98F68">COLOR</b><span>カラー<em>¥6,600</em></span><span>パーマ<em>¥8,800</em></span></div><div><b style="background:#6F8F82">CARE</b><span>スパ<em>¥4,400</em></span><span>眉カット<em>¥1,100</em></span></div>';
    async function loop() {
      for (;;) {
        chat.innerHTML = ''; sheet.classList.remove('open');
        sheet.querySelectorAll('.on').forEach(function (e) { e.classList.remove('on'); });
        caption('01', 'お客様は、タップするだけ');
        msg('友だち追加ありがとうございます！下のメニューからどうぞ。'); await wait(1300);
        tapAt(rm, .17, .76); await wait(450); msg('メニュー', 'me'); await typing();
        var car = msg(CAR, 'car'); await wait(1200);
        car.querySelectorAll('div').forEach(function (d) { d.style.transform = 'translateX(-124px)'; }); await wait(1400);
        caption('02', '日時を選んで、そのまま予約');
        tapAt(rm, .5, .76); await wait(450); sheet.classList.add('open'); await wait(900);
        var dts = sheet.querySelectorAll('.dts span'), sls = sheet.querySelectorAll('.sls span');
        tapAt(dts[1], .5, .5); dts[1].classList.add('on'); await wait(800);
        tapAt(sls[2], .5, .5); sls[2].classList.add('on'); await wait(800);
        var b = sheet.querySelector('.cfm'); tapAt(b, .5, .5); b.classList.add('press'); await wait(200); b.classList.remove('press'); await wait(300);
        sheet.classList.remove('open'); await wait(500);
        msg('<b>✓ ご予約が確定しました</b><span>5/18（土）14:00 レディースカット</span>', 'cf'); await wait(1600);
        caption('03', 'リマインドもお礼も、自動');
        await typing(); msg('<b>⏰ 明日のご予約のお知らせ</b><span>明日14:00、お待ちしています。</span>', 'cf rm2'); await wait(1700);
        tapAt(rm, .83, .76); await wait(450); msg('クーポン', 'me'); await typing();
        msg('<em>10%OFF</em><br><b>初回ご来店クーポン</b>', 'cp'); await wait(2600);
      }
    }
    if (reduced) { msg('ご予約が確定しました', 'in'); return; }
    loop();
  });

  // 2) 浮かぶ写真: スクロールに合わせて、少しずつ違う速さで動く
  var ph = [].slice.call(document.querySelectorAll('[data-par]'));
  // 3) 縦スクロールで、緑の帯のカードが横に流れる
  var gs = document.querySelector('.gs'), gsT = gs && gs.querySelector('.gs-track'), gsS = gs ? [].slice.call(gs.querySelectorAll('.gs-shapes span')) : [], gsBar = gs && gs.querySelector('.gs-prog i');
  var tick = false;
  function frame() {
    tick = false; var vh = innerHeight;
    if (!reduced) ph.forEach(function (e) { var r = e.parentNode.getBoundingClientRect(); var p = (r.top + r.height / 2 - vh / 2) / vh; e.style.transform = 'translateY(' + (p * parseFloat(e.dataset.par) * 160) + 'px) rotate(' + (e.dataset.rot || 0) + 'deg)'; });
    if (gs && gsT && innerWidth > 900) {
      var r = gs.getBoundingClientRect(), total = gs.offsetHeight - (vh - 72), p = Math.min(1, Math.max(0, -r.top / total));
      var max = gsT.scrollWidth - innerWidth + 40; gsT.style.transform = 'translateX(' + (-p * Math.max(0, max)) + 'px)';
      gsS.forEach(function (s) { s.style.transform = 'translateY(' + ((.5 - p) * 140) + 'px)'; });
      if (gsBar) gsBar.style.width = (p * 100) + '%';
    } 
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame); frame();

  // 4) 横送りのカード(矢印ボタン)
  document.querySelectorAll('.slider').forEach(function (s) {
    var t = s.querySelector('.slider-track'), b = s.querySelectorAll('.slider-nav button');
    if (!t || b.length < 2) return;
    b[0].addEventListener('click', function () { t.scrollBy({ left: -t.clientWidth * .9, behavior: 'smooth' }); });
    b[1].addEventListener('click', function () { t.scrollBy({ left: t.clientWidth * .9, behavior: 'smooth' }); });
  });

  // 5) 数字のカウントアップ
  var cs = [].slice.call(document.querySelectorAll('[data-count]'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        var el = e.target, to = parseFloat(el.dataset.count), t0 = null, fmt = function (v) { return Math.round(v).toLocaleString('en-US'); };
        if (reduced) { el.firstChild.nodeValue = fmt(to); return; }
        requestAnimationFrame(function st(t) { if (t0 === null) t0 = t; var k = Math.min(1, (t - t0) / 1200); el.firstChild.nodeValue = fmt(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(st); });
      });
    }, { threshold: .4 });
    cs.forEach(function (c) { io.observe(c); });
  }
})();
