// ========================================
// RAIZON サイト v3 アニメーション
// docs/ANIMATION.md の setupMotion() をそのまま移植(this.* はローカル変数に置換)
// ========================================
(function () {
  'use strict';

  function setupMotion() {
    var motion = 'standard';
    if (motion === 'off' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var k = motion === 'rich' ? 1.4 : 1;
    var ease = 'cubic-bezier(.22,.7,.3,1)';
    var anims = [];
    var hide = function (el, y) { anims.push(el.animate([{ opacity: 0, transform: 'translateY(' + y + 'px)' }], { duration: 0, fill: 'forwards' })); };
    var show = function (el, y, delay, dur) {
      dur = dur || 800;
      anims.push(el.animate(
        [{ opacity: 0, transform: 'translateY(' + y + 'px)' }, { opacity: 1, transform: 'none' }],
        { duration: dur, delay: delay, easing: ease, fill: 'both' }));
    };
    // hero
    var copy = document.querySelector('[data-hero-copy]');
    if (copy) [].slice.call(copy.children).forEach(function (c, i) { show(c, 20 * k, 100 + i * 110); });
    var phone = document.querySelector('[data-phone]');
    if (phone) show(phone, 40 * k, 300, 1000);
    var LOOP = 13000, T0 = 1000;
    var phoneAnims = [];
    var loop = function (el, frames) { var an = el.animate(frames, { duration: LOOP, delay: T0, iterations: Infinity, easing: 'ease-out', fill: 'both' }); anims.push(an); phoneAnims.push(an); };
    var inOut = function (st, y) {
      y = y || 8;
      return [
        { opacity: 0, transform: 'translateY(' + y + 'px)', offset: 0 },
        { opacity: 0, transform: 'translateY(' + y + 'px)', offset: st },
        { opacity: 1, transform: 'none', offset: st + 0.035 },
        { opacity: 1, transform: 'none', offset: 0.93 },
        { opacity: 0, transform: 'none', offset: 0.97 },
        { opacity: 0, transform: 'none', offset: 1 }];
    };
    var starts = [0.02, 0.1, 0.3, 0.42];
    var tapKF = [
      { opacity: 0, transform: 'scale(0.4)', offset: 0 }, { opacity: 0, transform: 'scale(0.4)', offset: 0.2 },
      { opacity: 1, transform: 'scale(1)', offset: 0.22 }, { opacity: 0, transform: 'scale(1.6)', offset: 0.26 }, { opacity: 0, offset: 1 }];
    var slotKF = [
      { background: 'transparent', color: '#146EF5', offset: 0 }, { background: 'transparent', color: '#146EF5', offset: 0.22 },
      { background: '#146EF5', color: '#FFFFFF', offset: 0.235 }, { background: '#146EF5', color: '#FFFFFF', offset: 1 }];
    var attachPhone = function () {
      var fresh = function (el) { return el.getAnimations().length === 0; };
      document.querySelectorAll('[data-bubble]').forEach(function (b) { if (fresh(b)) loop(b, inOut(starts[+b.dataset.bubble] || 0)); });
      document.querySelectorAll('[data-tap]').forEach(function (t) { if (fresh(t)) loop(t, tapKF); });
      document.querySelectorAll('[data-slot]').forEach(function (t) { if (fresh(t)) loop(t, slotKF); });
    };
    attachPhone();
    window.__rzAttachPhone = attachPhone;
    window.__rzPhoneAnims = phoneAnims;

    var toast = document.querySelector('[data-toast]');
    if (toast) loop(toast, [
      { opacity: 0, transform: 'translateY(-16px)', offset: 0 },
      { opacity: 0, transform: 'translateY(-16px)', offset: 0.58 },
      { opacity: 1, transform: 'none', offset: 0.62 },
      { opacity: 1, transform: 'none', offset: 0.86 },
      { opacity: 0, transform: 'translateY(-16px)', offset: 0.9 },
      { opacity: 0, transform: 'translateY(-16px)', offset: 1 }]);

    document.querySelectorAll('[data-panel-item]').forEach(function (p, i) { show(p, 14, 800 + i * 160, 700); });

    document.querySelectorAll('[data-float]').forEach(function (f) {
      var i = +f.dataset.float;
      show(f, 16, 700 + i * 220, 800);
      var amp = 6 * k;
      anims.push(f.animate(
        [{ translate: '0 0' }, { translate: '0 -' + amp + 'px' }, { translate: '0 0' }],
        { duration: 5200 + i * 700, delay: 1600 + i * 400, iterations: Infinity, easing: 'ease-in-out' }));
    });

    document.querySelectorAll('[data-marquee]').forEach(function (t) {
      var frames = t.dataset.marquee === 'left'
        ? [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }]
        : [{ transform: 'translateX(-50%)' }, { transform: 'translateX(0)' }];
      anims.push(t.animate(frames, { duration: 48000 / k, iterations: Infinity, easing: 'linear' }));
    });

    var cyc = [].slice.call(document.querySelectorAll('[data-cycle]'));
    var CYC = 8000;
    var mkKF = function (o, on, off) {
      var w = 0.25, kf = [Object.assign({}, off, { offset: 0 })];
      if (o > 0) kf.push(Object.assign({}, off, { offset: o }));
      kf.push(Object.assign({}, on, { offset: o + 0.03 }), Object.assign({}, on, { offset: o + w - 0.01 }), Object.assign({}, off, { offset: Math.min(o + w + 0.02, 1) }));
      if (o + w + 0.02 < 1) kf.push(Object.assign({}, off, { offset: 1 }));
      return kf;
    };
    cyc.forEach(function (c, i) {
      var o = i / 4;
      anims.push(c.animate(mkKF(o,
        { background: '#146EF5', color: '#FFFFFF', borderColor: '#146EF5', transform: 'scale(1.06)' },
        { background: '#FFFFFF', color: '#111827', borderColor: '#E5E9F0', transform: 'none' }), { duration: CYC, iterations: Infinity, easing: 'ease-in-out' }));
      c.querySelectorAll('span').forEach(function (sp, j) {
        anims.push(sp.animate(mkKF(o,
          { color: '#FFFFFF' }, { color: j === 0 ? '#146EF5' : '#111827' }), { duration: CYC, iterations: Infinity, easing: 'ease-in-out' }));
      });
    });

    var comet = document.querySelector('[data-comet]');
    if (comet) anims.push(comet.animate([{ transform: 'rotate(-90deg)' }, { transform: 'rotate(270deg)' }], { duration: CYC, iterations: Infinity, easing: 'linear' }));

    var onView = function (el, fn) {
      if (!el) return;
      var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { fn(); o.disconnect(); } }); }, { rootMargin: '0px 0px -15% 0px' });
      o.observe(el);
    };

    var jline = document.querySelector('[data-jline]');
    var jnodes = [].slice.call(document.querySelectorAll('[data-jnode]'));
    if (jline) {
      anims.push(jline.animate([{ transform: 'scaleX(0)' }], { duration: 0, fill: 'forwards' }));
      jnodes.forEach(function (n) { hide(n, 10); });
      onView(jline, function () {
        anims.push(jline.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 1800, delay: 200, easing: 'ease-in-out', fill: 'both' }));
        jnodes.forEach(function (n, i) { show(n, 10, 200 + i * 400, 500); });
      });
    }

    document.querySelectorAll('[data-svc-bar]').forEach(function (bEl, i) {
      anims.push(bEl.animate([{ transform: 'scaleY(0)' }], { duration: 0, fill: 'forwards' }));
      onView(bEl, function () { anims.push(bEl.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 700, delay: 300 + i * 90, easing: ease, fill: 'both' })); });
    });

    document.querySelectorAll('[data-svc-pop]').forEach(function (p) {
      anims.push(p.animate(
        [{ opacity: 0, transform: 'translateY(8px)', offset: 0 }, { opacity: 0, transform: 'translateY(8px)', offset: 0.15 },
        { opacity: 1, transform: 'none', offset: 0.22 }, { opacity: 1, transform: 'none', offset: 0.85 }, { opacity: 0, transform: 'none', offset: 0.95 }, { opacity: 0, offset: 1 }],
        { duration: 6000, delay: (+p.dataset.svcPop) * 1500, iterations: Infinity, easing: ease }));
    });

    document.querySelectorAll('[data-hubline]').forEach(function (ln, i) {
      anims.push(ln.animate([{ transform: 'scaleX(0)' }], { duration: 0, fill: 'forwards' }));
      onView(ln, function () { anims.push(ln.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 600, delay: 200 + i * 150, easing: ease, fill: 'both' })); });
    });

    var hub = document.querySelector('[data-hub]');
    if (hub) anims.push(hub.animate(
      [{ boxShadow: '0 0 0 0 rgba(20,110,245,0.35)' }, { boxShadow: '0 0 0 22px rgba(20,110,245,0)' }],
      { duration: 2200, iterations: Infinity, easing: 'ease-out' }));

    var ring = document.querySelector('[data-ring]');
    if (ring) anims.push(ring.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 40000, iterations: Infinity }));

    var marker = document.querySelector('[data-marker]');
    if (marker) {
      hide(marker, 0);
      var mo = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          anims.push(marker.animate([{ opacity: 1, transform: 'scaleX(0)' }, { opacity: 1, transform: 'scaleX(1)' }], { duration: 700, delay: 400, easing: ease, fill: 'both' }));
          mo.disconnect();
        });
      }, { rootMargin: '0px 0px -20% 0px' });
      mo.observe(marker);
    }

    // scroll reveal (h2 見出し・grid直下の要素を自動検出してフェードイン)
    var targets = [];
    document.querySelectorAll('section:not([data-screen-label="01 FV"])').forEach(function (sec) {
      sec.querySelectorAll('h2').forEach(function (h) { targets.push([h, 0]); });
      sec.querySelectorAll('h2 ~ p, h2 + p').forEach(function (p) { targets.push([p, 1]); });
      sec.querySelectorAll('div').forEach(function (d) {
        var st = d.getAttribute('style') || '';
        if (/display:\s*grid/.test(st) && d.children.length > 1 && !d.closest('[data-rv-grid]')) {
          d.setAttribute('data-rv-grid', '1');
          [].slice.call(d.children).forEach(function (c, i) { targets.push([c, i]); });
        }
      });
    });
    var vh = window.innerHeight;
    var pending = new Map();
    targets.forEach(function (t) {
      var el = t[0], i = t[1];
      if (pending.has(el)) return;
      if (el.getBoundingClientRect().top < vh * 0.9) return;
      hide(el, 28 * k); pending.set(el, i);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, i = pending.get(el) || 0;
        show(el, 28 * k, Math.min(i, 5) * 90);
        io.unobserve(el); pending.delete(el);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    pending.forEach(function (_, el) { io.observe(el); });

    window.__rzAnims = anims;
  }

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(setupMotion, 60);
  });
})();
