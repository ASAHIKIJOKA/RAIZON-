/* テストページ(test-fv.html)専用: メインビューのステップ式フォーム。
   送信先・必須項目・迷惑送信よけは、今のお問い合わせフォームと同じ(/api/contact)。 */
(function () {
  'use strict';
  var form = document.getElementById('fvform');
  if (!form) return;
  var q = function (s, r) { return (r || document).querySelector(s); };
  var qa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var steps = qa('.fv2__step', form), bars = qa('.fv2__prog i', form);
  var done = document.getElementById('fvdone'), fail = document.getElementById('fvfail'), send = document.getElementById('fvsend');
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var cur = 1;

  function show(n, focus) {
    cur = n;
    steps.forEach(function (s) { s.hidden = Number(s.getAttribute('data-step')) !== n; });
    bars.forEach(function (b, i) { b.classList.toggle('is-on', i < n); });
    if (focus) {
      var top = form.getBoundingClientRect().top + window.pageYOffset - 92;
      if (top < window.pageYOffset) window.scrollTo({ top: top, behavior: 'smooth' });
      if (n === 3) { var el = form.elements.name; if (el) setTimeout(function () { el.focus({ preventScroll: true }); }, 150); }
    }
  }

  // 選択式の質問は、選ぶと次へ進む
  qa('.fv2__opt input', form).forEach(function (r) {
    r.addEventListener('change', function () {
      var step = Number(r.closest('.fv2__step').getAttribute('data-step'));
      setTimeout(function () { show(step + 1, true); }, 180);
    });
  });
  qa('.fv2__back', form).forEach(function (b) {
    b.addEventListener('click', function () { show(Number(b.getAttribute('data-back')), true); });
  });

  var val = function (k) { return (form.elements[k].value || '').trim(); };
  var setErr = function (k, msg) {
    var el = q('[data-err="' + k + '"]', form); if (el) el.textContent = msg || '';
    var inp = form.elements[k]; if (inp && inp.type !== 'checkbox') inp.classList.toggle('is-err', !!msg);
  };
  function validate() {
    var e = {};
    if (!val('name')) e.name = 'お名前を入力してください';
    if (!val('tel')) e.tel = '電話番号を入力してください';
    else if (val('tel').replace(/[^0-9]/g, '').length < 9) e.tel = '電話番号の形式が正しくありません';
    if (!val('email')) e.email = 'メールアドレスを入力してください';
    else if (!EMAIL.test(val('email'))) e.email = 'メールアドレスの形式が正しくありません';
    if (!form.elements.agree.checked) e.agree = 'プライバシーポリシーへの同意が必要です';
    return e;
  }
  ['name', 'tel', 'email', 'agree'].forEach(function (k) {
    form.elements[k].addEventListener(k === 'agree' ? 'change' : 'input', function () { setErr(k, ''); });
  });

  function checked(name) { var el = q('input[name="' + name + '"]:checked', form); return el ? el.value : '未選択'; }
  function utm() {
    try {
      var p = new URLSearchParams(location.search);
      if (p.get('utm_source')) return [p.get('utm_source'), p.get('utm_medium') || '', p.get('utm_campaign') || '', p.get('utm_content') || ''].join('/').slice(0, 120);
      return sessionStorage.getItem('rz_utm') || '';
    } catch (x) { return ''; }
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var e = validate();
    ['name', 'tel', 'email', 'agree'].forEach(function (k) { setErr(k, e[k]); });
    if (Object.keys(e).length) { var first = q('.is-err', form); if (first) first.focus(); return; }
    fail.textContent = ''; send.disabled = true; send.textContent = '送信中…';
    var u = utm();
    var msg = ['【ホームページ案の無料作成の希望】', 'つくりたいもの: ' + checked('want'), '業種: ' + checked('biz'), 'ご要望・ご質問: ' + (val('note') || '（なし）')].join('\n');
    var body = {
      kind: 'ホームページ案の無料作成', company: '', name: val('name'), email: val('email'), tel: val('tel'),
      budget: '', message: msg, agree: true, website: form.elements.website.value,
      source: 'osaka-home-fv-step' + (location.pathname.indexOf('test-fv') > -1 ? '(テストページ)' : '') + (u ? ' [utm=' + u + ']' : '') + (document.referrer ? ' / ' + document.referrer : '')
    };
    fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        steps.forEach(function (s) { s.hidden = true; });
        form.querySelector('.fv2__prog').hidden = true;
        done.hidden = false;
        try { if (window.gtag) window.gtag('event', 'generate_lead', { method: 'fv_step_form', campaign: u }); if (window.fbq) window.fbq('track', 'Lead'); } catch (x) {}
      })
      .catch(function () { fail.textContent = '送信に失敗しました。時間をおいて再度お試しください。'; })
      .then(function () { send.disabled = false; send.textContent = 'ホームページ案を無料で受け取る'; });
  });

  // ヘッダーの申し込みボタン: フォームの位置へ(1問目に戻す必要はない)
  var ask = q('.hd__ask');
  if (ask) ask.addEventListener('click', function (ev) {
    ev.preventDefault();
    var top = form.getBoundingClientRect().top + window.pageYOffset - 92;
    window.scrollTo({ top: top, behavior: 'smooth' });
  });
})();
