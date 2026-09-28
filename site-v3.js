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

    /* ---------- ブログプレビュー(サーバー生成済みカードをカテゴリ絞り込み) ---------- */
    var blogCats = document.getElementById('rz3-blog-cats');
    if (blogCats) {
      var catBtns = blogCats.querySelectorAll('.rz3-blog-cat-btn');
      catBtns.forEach(function (b) {
        b.addEventListener('click', function () {
          var cat = b.getAttribute('data-cat');
          catBtns.forEach(function (o) { o.classList.toggle('on', o === b); });
          document.querySelectorAll('.rz3-blog-card').forEach(function (card) {
            card.style.display = (cat === 'すべて' || card.getAttribute('data-cat') === cat) ? '' : 'none';
          });
        });
      });
    }
  });
})();
