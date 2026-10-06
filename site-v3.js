// ========================================
// RAIZON サイト v3 (design_handoff_raizon_home 準拠) 共通JS
// ========================================
(function () {
  'use strict';

  // 流入元の記録(初回訪問時のみ) — site-v2.js と同じロジック
  try {
    if (!localStorage.getItem('raizon_src')) {
      var p = new URLSearchParams(location.search);
      var ref = '';
      try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
      localStorage.setItem('raizon_src', [p.get('utm_source') || ref || 'direct', p.get('utm_medium') || '', p.get('utm_campaign') || '', location.pathname].join('|'));
    }
  } catch (e) {}

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------- スクロールリビール(main.js の setupMotion に統一) ---------- */

    /* ---------- モバイルナビ(ハンバーガー) ---------- */
    var navToggle = document.querySelector('.rz3-nav-toggle');
    var mobileNav = document.querySelector('.rz3-mobile-nav');
    if (navToggle && mobileNav) {
      var closeNav = function () {
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      };
      navToggle.addEventListener('click', function () {
        var willOpen = !navToggle.classList.contains('open');
        navToggle.classList.toggle('open', willOpen);
        navToggle.setAttribute('aria-expanded', String(willOpen));
        mobileNav.classList.toggle('open', willOpen);
        document.body.style.overflow = willOpen ? 'hidden' : '';
      });
      mobileNav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeNav); });
      window.addEventListener('resize', function () { if (window.innerWidth > 900) closeNav(); });
    }

    /* ---------- FAQ アコーディオン ---------- */
    document.querySelectorAll('.rz3-faq-item').forEach(function (item) {
      var q = item.querySelector('.rz3-faq-q');
      var icon = item.querySelector('.rz3-faq-icon');
      if (!q) return;
      q.addEventListener('click', function () {
        var willOpen = !item.classList.contains('open');
        item.parentElement.querySelectorAll('.rz3-faq-item').forEach(function (other) {
          other.classList.remove('open');
          var oi = other.querySelector('.rz3-faq-icon');
          if (oi) oi.textContent = '+';
        });
        if (willOpen) {
          item.classList.add('open');
          if (icon) icon.textContent = '−';
        }
      });
    });

    /* ---------- FVの業種タブ切り替え ---------- */
    var scTabs = document.querySelectorAll('[data-sc-tab]');
    var scPanels = document.querySelectorAll('[data-sc-panel]');
    scTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-sc-tab');
        if (tab.classList.contains('active')) return;
        scTabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
        scPanels.forEach(function (p) { p.style.display = (p.getAttribute('data-sc-panel') === key) ? '' : 'none'; });
        /* 美容室タブは専用のリッチメニュー画像、それ以外は共通のメニューを表示 */
        document.querySelectorAll('[data-sc-menu]').forEach(function (m) {
          var isSalon = m.getAttribute('data-sc-menu') === 'salon';
          m.style.display = (isSalon === (key === 'salon')) ? (isSalon ? '' : 'grid') : 'none';
        });
        requestAnimationFrame(function () {
          if (!window.__rzAttachPhone) return;
          window.__rzPhoneAnims = (window.__rzPhoneAnims || []).filter(function (an) { return an.effect && an.effect.target && an.effect.target.isConnected; });
          window.__rzAttachPhone();
          window.__rzPhoneAnims.forEach(function (an) { an.currentTime = 0; });
        });
      });
    });

    /* ---------- デスクトップ側面CTA(スクロールで表示) ---------- */
    var sideCta = document.querySelector('.rz3-side-cta');
    var contactSection = document.getElementById('contact');
    if (sideCta) {
      var onScroll = function () {
        var past = window.scrollY > 560;
        var atContact = contactSection && contactSection.getBoundingClientRect().top < window.innerHeight * 0.6;
        sideCta.classList.toggle('show', past && !atContact);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* ---------- お問い合わせフォーム ---------- */
    var form = document.getElementById('rz3ContactForm');
    if (form) {
      var topicBtns = form.querySelectorAll('[data-topic]');
      var indBtns = form.querySelectorAll('[data-ind]');
      topicBtns.forEach(function (b) {
        b.addEventListener('click', function () { b.classList.toggle('on'); });
      });
      indBtns.forEach(function (b) {
        b.addEventListener('click', function () {
          indBtns.forEach(function (o) { if (o !== b) o.classList.remove('on'); });
          b.classList.toggle('on');
        });
      });

      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var errBox = form.querySelector('.rz3-form-err');
        var name = form.querySelector('#f-name').value.trim();
        var tel = form.querySelector('#f-tel').value.trim();
        var email = form.querySelector('#f-email').value.trim();
        var telOk = /^[0-9０-９+\-－() ]{10,15}$/.test(tel);
        var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!name || !telOk || !emailOk) {
          if (errBox) {
            errBox.style.display = 'block';
            errBox.textContent = (!name || !tel || !email)
              ? 'お名前・電話番号・メールアドレスを入力してください。'
              : '電話番号またはメールアドレスの形式をご確認ください。';
          }
          return;
        }
        if (errBox) errBox.style.display = 'none';

        var topics = [].slice.call(topicBtns).filter(function (b) { return b.classList.contains('on'); }).map(function (b) { return b.getAttribute('data-topic'); });
        var indBtn = [].slice.call(indBtns).find(function (b) { return b.classList.contains('on'); });
        var ind = indBtn ? indBtn.getAttribute('data-ind') : '';
        var msg = form.querySelector('#f-msg').value.trim();
        var summary = [ind].concat(topics).filter(Boolean).join('／') || 'ご相談内容はご連絡時にお伺いします';

        var btn = form.querySelector('.rz3-submit-btn');
        var originalText = btn.textContent;
        btn.textContent = '送信中...';
        btn.disabled = true;

        var payload = {
          name: name,
          email: email,
          phone: tel,
          company: form.querySelector('#f-company').value.trim(),
          services: summary,
          message: msg ? (summary + '\n\n' + msg) : summary,
          website: form.querySelector('#f-hp').value
        };
        try { payload.source = localStorage.getItem('raizon_src') || ''; } catch (e) { payload.source = ''; }

        try {
          var res = await fetch('/api/contact', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
          });
          if (res.ok) {
            form.querySelector('.rz3-form-fields').style.display = 'none';
            var sentBox = form.querySelector('.rz3-form-sent');
            if (sentBox) {
              sentBox.style.display = 'block';
              var nameSlot = sentBox.querySelector('[data-sent-name]');
              if (nameSlot) nameSlot.textContent = name;
              var sumSlot = sentBox.querySelector('[data-sent-summary]');
              if (sumSlot) sumSlot.textContent = summary;
            }
          } else {
            btn.textContent = originalText;
            btn.disabled = false;
            alert('送信に失敗しました。恐れ入りますが、公式LINEよりお問い合わせください。');
          }
        } catch (err) {
          btn.textContent = originalText;
          btn.disabled = false;
          alert('送信に失敗しました。恐れ入りますが、公式LINEよりお問い合わせください。');
        }
      });
    }

    /* ---------- ブログ(カテゴリ絞り込み + 横スライド) ---------- */
    var blogCats = document.getElementById('rz3-blog-cats');
    var track = document.getElementById('rz3-blog-grid');
    if (blogCats && track) {
      var catBtns = blogCats.querySelectorAll('.rz3-blog-cat-btn');
      var prevBtn = document.getElementById('rz3-blog-prev');
      var nextBtn = document.getElementById('rz3-blog-next');
      var countEl = document.getElementById('rz3-blog-count');
      var pagerEl = document.getElementById('rz3-blog-pager');
      var gapOf = function () { return parseFloat(getComputedStyle(track).columnGap) || 24; };
      var geom = function () {
        var cards = Array.prototype.filter.call(track.querySelectorAll('.rz3-blog-card'), function (c) { return c.style.display !== 'none'; });
        if (!cards.length) return { n: 0, per: 1, step: 1, pages: 1, page: 1 };
        var step = cards[0].offsetWidth + gapOf();
        var per = Math.max(1, Math.floor((track.clientWidth + gapOf()) / step));
        var pages = Math.max(1, Math.ceil(cards.length / per));
        var max = track.scrollWidth - track.clientWidth;
        var page = track.scrollLeft >= max - 2 ? pages : Math.min(pages, Math.round(track.scrollLeft / (per * step)) + 1);
        return { n: cards.length, per: per, step: step, pages: pages, page: page, atStart: track.scrollLeft <= 2, atEnd: track.scrollLeft >= max - 2 };
      };
      var update = function () {
        var g = geom();
        if (countEl) countEl.textContent = g.page + ' / ' + g.pages;
        if (prevBtn) prevBtn.disabled = !!g.atStart;
        if (nextBtn) nextBtn.disabled = !!g.atEnd;
        if (pagerEl) pagerEl.style.display = g.pages > 1 ? '' : 'none';
      };
      var go = function (dir) { var g = geom(); track.scrollBy({ left: dir * g.per * g.step, behavior: 'smooth' }); };
      if (prevBtn) prevBtn.addEventListener('click', function () { go(-1); });
      if (nextBtn) nextBtn.addEventListener('click', function () { go(1); });
      var ticking = false;
      track.addEventListener('scroll', function () { if (ticking) return; ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); }, { passive: true });
      window.addEventListener('resize', update);
      catBtns.forEach(function (b) {
        b.addEventListener('click', function () {
          var cat = b.getAttribute('data-cat');
          catBtns.forEach(function (o) { o.classList.toggle('on', o === b); });
          var shown = 0;
          track.querySelectorAll('.rz3-blog-card').forEach(function (card) {
            var ok = cat === 'すべて' ? card.hasAttribute('data-home') : card.getAttribute('data-cat') === cat;
            card.style.display = ok ? '' : 'none';
            if (ok) shown++;
          });
          var empty = document.getElementById('rz3-blog-empty');
          if (empty) empty.style.display = shown ? 'none' : '';
          track.scrollLeft = 0;
          update();
        });
      });
      update();
      window.addEventListener('load', update);
    }
  });

  // FV: スクロール連動の動き(背景パーツは速度差で流れ、スマホはゆっくり傾いて浮く)
  (function () {
    var hero = document.querySelector('.rz3-hero-section');
    if (!hero || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var items = [].slice.call(hero.querySelectorAll('[data-speed]'));
    var tilt = hero.querySelector('[data-tilt]');
    var ticking = false;
    function frame() {
      ticking = false;
      var y = window.pageYOffset || 0;
      var h = hero.offsetHeight || 1;
      if (y > h + 200) return;
      items.forEach(function (el) {
        el.style.transform = 'translate3d(0,' + (y * parseFloat(el.getAttribute('data-speed'))).toFixed(1) + 'px,0)';
      });
      if (tilt) {
        var k = window.innerWidth < 768 ? 0.35 : 1;
        var p = Math.min(y / Math.min(h, 900), 1);
        tilt.style.transform = 'translate3d(0,' + (-p * 70 * k).toFixed(1) + 'px,0)';
      }
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
    frame();
  })();


  // ちょっとした動き: 読み進めバー / SCROLL表示 / 料金のカウントアップ / デモ枠の背景パーツ
  (function () {
    var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var bar = document.createElement('div');
    bar.className = 'rz3-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var cue = document.querySelector('.rz3-scroll');
    var pars = [].slice.call(document.querySelectorAll('[data-par]'));
    var ticking = false;
    function frame() {
      ticking = false;
      var y = window.pageYOffset || 0;
      var max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      bar.style.transform = 'scaleX(' + Math.min(y / max, 1).toFixed(4) + ')';
      if (cue) cue.classList.toggle('hide', y > 80);
      if (reduced) return;
      pars.forEach(function (el) {
        var r = el.parentNode.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
        var off = (r.top + r.height / 2 - window.innerHeight / 2) * parseFloat(el.getAttribute('data-par'));
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
    window.addEventListener('resize', frame);
    frame();

    var num = document.querySelector('[data-count]');
    if (num && !reduced && 'requestAnimationFrame' in window) {
      var to = parseInt(num.getAttribute('data-count'), 10);
      num.textContent = '0';
      var t0 = null;
      setTimeout(function () {
        requestAnimationFrame(function step(t) {
          if (t0 === null) t0 = t;
          var p = Math.min((t - t0) / 1300, 1);
          num.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US');
          if (p < 1) requestAnimationFrame(step);
        });
      }, 500);
    }
  })();

  // スクロールで動く仕掛け: 流れる文字帯 / 見出しの下線 / 画像のズームイン / 料金のカウントアップ
  (function () {
    var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ticker = document.getElementById('rz3-ticker');
    var h2s = [].slice.call(document.querySelectorAll('.rz3-h2'));
    var imgs = [].slice.call(document.querySelectorAll('section img')).filter(function (im) {
      return !im.closest('.rz3-hero-section') && !im.closest('.rz3-demo-card') && !im.closest('.rz3-blog-card') && !im.closest('.rz3-logo') && !im.closest('header') && !im.closest('footer');
    });
    var cus = [].slice.call(document.querySelectorAll('[data-cu]'));

    h2s.forEach(function (h) { if (getComputedStyle(h).textAlign === 'center') h.classList.add('rz3-h2-c'); });
    if (reduced || !('IntersectionObserver' in window)) { h2s.forEach(function (h) { h.classList.add('rz3-in'); }); return; }

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);
        if (el.classList.contains('rz3-h2')) { el.classList.add('rz3-in'); return; }
        if (el.hasAttribute('data-cu')) {
          var to = parseInt(el.getAttribute('data-cu'), 10), t0 = null;
          requestAnimationFrame(function step(t) {
            if (t0 === null) t0 = t;
            var p = Math.min((t - t0) / 1100, 1);
            el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US');
            if (p < 1) requestAnimationFrame(step);
          });
          return;
        }
        if (el.tagName === 'IMG' && el.animate) {
          var cs = getComputedStyle(el.parentElement);
          if (cs.overflow !== 'visible') el.animate([{ scale: '1.16' }, { scale: '1' }], { duration: 1500, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
        }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    h2s.forEach(function (h) { io.observe(h); });
    imgs.forEach(function (im) { io.observe(im); });
    cus.forEach(function (c) { io.observe(c); });

    if (ticker) {
      var tk = false;
      var update = function () {
        tk = false;
        var r = ticker.parentNode.getBoundingClientRect();
        if (r.bottom < -100 || r.top > window.innerHeight + 100) return;
        ticker.style.transform = 'translate3d(' + (-(window.pageYOffset * 0.35) % (ticker.scrollWidth / 3)).toFixed(1) + 'px,0,0)';
      };
      window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(update); } }, { passive: true });
      update();
    }
  })();
})();
