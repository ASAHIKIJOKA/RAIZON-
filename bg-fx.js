// 全ページ共通の背景: 固定レイヤーの光の玉が、スクロールに合わせてゆっくり動く
(function () {
  'use strict';
  if (document.querySelector('.rzbg')) return;
  var bg = document.createElement('div');
  bg.className = 'rzbg';
  bg.setAttribute('aria-hidden', 'true');
  bg.innerHTML = '<span class="dots"></span><i class="b1"></i><i class="b2"></i><i class="b3"></i>';
  document.body.insertBefore(bg, document.body.firstChild);
  if (!document.body.classList.contains('rz3')) document.body.classList.add('rzbg-old');
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var b1 = bg.querySelector('.b1'), b2 = bg.querySelector('.b2'), b3 = bg.querySelector('.b3'), dots = bg.querySelector('.dots');
  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.pageYOffset || 0;
    var max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    var p = Math.min(y / max, 1);
    var w = window.innerWidth, h = window.innerHeight;
    b1.style.transform = 'translate3d(' + (-p * w * 0.35).toFixed(0) + 'px,' + (p * h * 0.9).toFixed(0) + 'px,0) scale(' + (1 + p * 0.15).toFixed(3) + ')';
    b2.style.transform = 'translate3d(' + (p * w * 0.45).toFixed(0) + 'px,' + (-p * h * 0.8).toFixed(0) + 'px,0) scale(' + (1.1 - p * 0.15).toFixed(3) + ')';
    b3.style.transform = 'translate3d(' + (Math.sin(p * 6.28) * w * 0.18).toFixed(0) + 'px,' + (Math.cos(p * 6.28) * h * 0.3).toFixed(0) + 'px,0)';
    dots.style.transform = 'translate3d(0,' + (-(y * 0.12) % 32).toFixed(1) + 'px,0)';
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  window.addEventListener('resize', frame);
  frame();

  // ---- ゆっくり漂う動き(CSSの動きが止まる端末でも動くよう、JSで時間から計算する) ----
  var canTr = window.CSS && CSS.supports && CSS.supports('translate', '0 1px');
  var drift = [].slice.call(document.querySelectorAll('.rz3-deco, .rz3-chip, .rz3-aur'));
  drift.forEach(function (el) { el.style.animation = 'none'; });
  // 光の粒(全ページ共通): 下からゆっくり昇る
  var small = window.innerWidth < 768, N = small ? 9 : 16, parts = [];
  var cols = ['rgba(120,170,255,.55)', 'rgba(90,220,150,.5)', 'rgba(255,205,130,.55)', 'rgba(255,255,255,.9)'];
  for (var i = 0; i < N; i++) {
    var s = document.createElement('span'); s.className = 'rzp';
    var size = 6 + Math.random() * 18; s.style.width = s.style.height = size + 'px';
    s.style.background = cols[i % cols.length];
    bg.appendChild(s);
    parts.push({ el: s, x: Math.random(), y: Math.random(), sp: 0.012 + Math.random() * 0.03, ph: Math.random() * 6.28, amp: 12 + Math.random() * 28 });
  }
  var blobs = [b1, b2, b3];
  var last = 0;
  function loop(t) {
    requestAnimationFrame(loop);
    if (document.hidden || t - last < 24) return; last = t;
    var w = window.innerWidth, h = window.innerHeight;
    if (canTr) {
      blobs.forEach(function (b, i) {
        b.style.translate = (Math.sin(t / (9000 + i * 2300) + i) * 70).toFixed(1) + 'px ' + (Math.cos(t / (11000 + i * 1700) + i * 2) * 60).toFixed(1) + 'px';
      });
      drift.forEach(function (el, i) {
        var c = el.className, k = t + i * 1300;
        if (c.indexOf('rz3-aur') > -1) {
          el.style.translate = (Math.sin(k / 9000) * 80).toFixed(1) + 'px ' + (Math.cos(k / 11000) * 70).toFixed(1) + 'px';
          el.style.scale = (1 + Math.sin(k / 7000) * 0.08).toFixed(3);
        } else if (c.indexOf('ring') > -1) {
          el.style.rotate = ((t / 60000) * 360 % 360).toFixed(2) + 'deg';
          el.style.translate = '0px ' + (Math.sin(k / 6000) * 18).toFixed(1) + 'px';
        } else if (c.indexOf('rz3-chip') > -1) {
          el.style.translate = (Math.sin(k / 3300) * 5).toFixed(1) + 'px ' + (Math.sin(k / 2400) * 9).toFixed(1) + 'px';
        } else {
          el.style.translate = (Math.sin(k / 5200) * 14).toFixed(1) + 'px ' + (Math.sin(k / 3700) * 22).toFixed(1) + 'px';
          if (c.indexOf('sq') > -1 || c.indexOf('dia') > -1 || c.indexOf('bar') > -1) el.style.rotate = ((c.indexOf('sq') > -1 ? 14 : c.indexOf('dia') > -1 ? 38 : -24) + Math.sin(k / 4300) * 7).toFixed(1) + 'deg';
        }
      });
    }
    parts.forEach(function (p, i) {
      var y = ((p.y - (t / 1000) * p.sp) % 1 + 1) % 1;
      var x = p.x * w + Math.sin(t / 2600 + p.ph) * p.amp;
      p.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + (y * (h + 60) - 30).toFixed(1) + 'px,0)';
      p.el.style.opacity = (0.15 + 0.55 * Math.sin(y * Math.PI)).toFixed(2);
    });
  }
  requestAnimationFrame(loop);
})();
