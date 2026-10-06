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
})();
