// FVのスマホ: 実際のデモ(Atelier)と同じ流れの自動再生
(function () {
  'use strict';
  // FVのスマホ: 実際のデモ(Atelier)と同じ流れを自動再生(メニュー表示 → 予約 → クーポン)
  (function () {
    var msgs = document.getElementById('hp-msgs');
    var sheet = document.getElementById('hp-sheet');
    var tap = document.getElementById('hp-tap');
    var cap = document.getElementById('hp-caption');
    var phone = document.querySelector('.rz3-hero-phone');
    if (!msgs || !sheet || !tap || !cap || !phone) return;
    var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0.05 }).observe(phone);
    }
    function sleep(ms) {
      return new Promise(function (res) {
        setTimeout(function wait() { if (visible) res(); else setTimeout(wait, 300); }, ms);
      });
    }
    function add(html, cls) {
      var d = document.createElement('div');
      d.className = 'hp-msg ' + cls;
      d.innerHTML = html;
      msgs.appendChild(d);
      while (msgs.children.length > 7) msgs.removeChild(msgs.firstChild);
      return d;
    }
    function typing() {
      var d = document.createElement('div');
      d.className = 'hp-msg hp-typing';
      d.innerHTML = '<i></i><i></i><i></i>';
      msgs.appendChild(d);
      return sleep(650).then(function () { if (d.parentNode) d.parentNode.removeChild(d); });
    }
    function tapAt(x, y) {
      tap.style.left = x + '%'; tap.style.top = y + '%';
      tap.classList.remove('go'); void tap.offsetWidth; tap.classList.add('go');
    }
    function caption(tag, text) {
      cap.classList.add('sw');
      setTimeout(function () { cap.innerHTML = '<b>' + tag + '</b><span>' + text + '</span>'; cap.classList.remove('sw'); }, 280);
    }
    function card(head, color, rows) {
      return '<div class="hp-card"><div class="hp-card-h" style="background:' + color + '">' + head + '</div><div class="hp-card-b">' +
        rows.map(function (r) { return '<div><span>' + r[0] + '</span><em>' + r[1] + '</em></div>'; }).join('') +
        '</div><div class="hp-card-f">予約する</div></div>';
    }
    var CAROUSEL = '<div class="hp-car-in">' +
      card('CUT', '#8A7767', [['レディース 60分', '¥5,500'], ['メンズ 45分', '¥4,400'], ['キッズ 30分', '¥3,300']]) +
      card('COLOR・PERM', '#B98F68', [['カラー 90分', '¥6,600'], ['パーマ 120分', '¥8,800'], ['縮毛矯正 150分', '¥13,200']]) +
      card('CARE', '#6F8F82', [['トリートメント', '¥3,300'], ['ヘッドスパ 30分', '¥4,400'], ['眉カット 15分', '¥1,100']]) +
      '</div>';
    var CONF = '<div class="hp-conf-h">✓ ご予約が確定しました</div><div class="hp-conf-b">日時：5/18（土）14:00<br>メニュー：レディースカット（60分）<br>担当：スタイリストA　¥5,500</div>';
    var COUPON = '<span class="hp-cp-badge">10%OFF</span><b>初回ご来店クーポン</b><small>全メニュー対象・30日間有効</small><div class="hp-card-f">クーポンを使う</div>';

    var steps = [].slice.call(sheet.querySelectorAll('.hp-st'));
    var dots = [].slice.call(sheet.querySelectorAll('.hp-dots u'));
    var btn = document.getElementById('hp-confirm');
    function showStep(n) {
      steps.forEach(function (st, i) { st.classList.toggle('show', i === n - 1); });
      dots.forEach(function (d, i) { d.classList.toggle('on', i < n); });
    }
    function resetSheet() {
      sheet.classList.remove('open');
      sheet.querySelectorAll('.on').forEach(function (e) { if (!e.classList.contains('hp-dots')) e.classList.remove('on'); });
      steps.forEach(function (st) { st.classList.remove('show'); });
      dots.forEach(function (d) { d.classList.remove('on'); });
      btn.classList.remove('press');
    }
    function choose(n, idx) {
      var items = steps[n - 1].querySelectorAll('.hp-row, .hp-dates span, .hp-slots span');
      return sleep(700).then(function () {
        [].slice.call(items).forEach(function (e, i) { e.classList.toggle('on', i === idx); });
      });
    }
    function slide(x) { var c = msgs.querySelector('.hp-car-in'); if (c) c.style.transform = 'translateX(' + x + 'px)'; }

    function staticView() {
      add('友だち追加ありがとうございます。下のメニューから、メニュー・ご予約・クーポンを試せます。', 'hp-bot');
      add('メニュー', 'hp-user');
      add(CAROUSEL, 'hp-car');
      add(CONF, 'hp-conf');
    }

    async function cycle() {
      msgs.innerHTML = ''; resetSheet();
      add('友だち追加ありがとうございます。<br>下のメニューから、メニュー・ご予約・クーポンを試せます。', 'hp-bot');
      await sleep(1100);
      // MENU
      caption('MENU', 'カテゴリ別のカードで、料金と所要時間を表示');
      tapAt(16.7, 76); await sleep(500);
      add('メニュー', 'hp-user'); await sleep(350); await typing();
      add(CAROUSEL, 'hp-car'); await sleep(1300); slide(-150); await sleep(1500); slide(-276); await sleep(1700);
      // RESERVE
      caption('RESERVE', 'メニュー → 担当 → 空き日時 → 確定。24時間受付');
      tapAt(50, 76); await sleep(500);
      add('予約', 'hp-user'); await sleep(350); await typing();
      add('ご予約はこちらから。<br>メニュー・担当・日時を選べます。<div class="hp-card-f" style="margin-top:6px">予約フォームを開く</div>', 'hp-bot');
      await sleep(1100);
      sheet.classList.add('open'); await sleep(500);
      showStep(1); await choose(1, 0); await sleep(700);
      showStep(2); await choose(2, 1); await sleep(700);
      showStep(3); await choose(3, 1); await choose(3, 2); await sleep(500);
      showStep(4); await sleep(1300); btn.classList.add('press'); await sleep(260);
      sheet.classList.remove('open'); await sleep(700);
      add(CONF, 'hp-conf'); await sleep(2400);
      // COUPON
      caption('COUPON', '初回10%OFFを配信。会計時にスタッフへ提示');
      tapAt(83.3, 76); await sleep(500);
      add('クーポン', 'hp-user'); await sleep(350); await typing();
      add(COUPON, 'hp-cp'); await sleep(3200);
    }
    async function loop() { for (;;) { await cycle(); } }

    if (reduced || !window.Promise) { staticView(); return; }
    loop();
  })();
})();
