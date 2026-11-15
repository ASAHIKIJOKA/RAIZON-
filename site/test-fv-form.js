/* テストページ(test-fv-form.html)専用: 質問の専用ページ。2/3 業種 → 3/3 連絡先 → 送信。
   送信先・必須項目・迷惑送信よけは、今のお問い合わせフォームと同じ(/api/contact)。 */
(function () {
  'use strict';
  var form = document.getElementById('fvp');
  if (!form) return;
  var q = function (s, r) { return (r || document).querySelector(s); };
  var qa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var WANT = { 'new': '新しくホームページを作りたい', redo: 'いまのホームページを作り直したい', undecided: 'まだ決まっていない・相談したい' };
  var params = new URLSearchParams(location.search);
  var want = WANT[params.get('want')] || '未選択';
  var steps = qa('.fv2__step', form), bars = qa('#fvpProg i'), num = document.getElementById('fvpN');
  var done = document.getElementById('fvdone'), fail = document.getElementById('fvfail'), send = document.getElementById('fvsend');
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // 1問目の選択をしないで来た場合は、メインビューへ戻す
  if (!WANT[params.get('want')]) { location.replace('test-fv.html#fvform'); return; }

  function show(n, focus) {
    steps.forEach(function (s) { s.hidden = Number(s.getAttribute('data-step')) !== n; });
    bars.forEach(function (b, i) { b.classList.toggle('is-on', i < n); });
    num.textContent = n;
    if (focus) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (n === 3) setTimeout(function () { form.elements.name.focus({ preventScroll: true }); }, 200);
    }
  }
  qa('input[name="biz"]', form).forEach(function (r) { r.addEventListener('change', function () { setTimeout(function () { show(3, true); }, 180); }); });
  document.getElementById('fvpBack2').addEventListener('click', function () { show(2, true); });

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
  function utm() {
    try {
      if (params.get('utm_source')) return [params.get('utm_source'), params.get('utm_medium') || '', params.get('utm_campaign') || '', params.get('utm_content') || ''].join('/').slice(0, 120);
      return sessionStorage.getItem('rz_utm') || '';
    } catch (x) { return ''; }
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var e = validate();
    ['name', 'tel', 'email', 'agree'].forEach(function (k) { setErr(k, e[k]); });
    if (Object.keys(e).length) { var first = q('.is-err', form); if (first) first.focus(); return; }
    fail.textContent = ''; send.disabled = true; send.textContent = '送信中…';
    var u = utm(), biz = q('input[name="biz"]:checked', form);
    var msg = ['【ホームページ案の無料作成の希望】', 'つくりたいもの: ' + want, '業種: ' + (biz ? biz.value : '未選択'), 'ご要望・ご質問: ' + (val('note') || '（なし）')].join('\n');
    var body = {
      kind: 'ホームページ案の無料作成', company: '', name: val('name'), email: val('email'), tel: val('tel'),
      budget: '', message: msg, agree: true, website: form.elements.website.value,
      source: 'osaka-home-fv-step' + (location.pathname.indexOf('test-fv') > -1 ? '(テストページ)' : '') + (u ? ' [utm=' + u + ']' : '') + (document.referrer ? ' / ' + document.referrer : '')
    };
    fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        steps.forEach(function (s) { s.hidden = true; });
        q('.fvp__top', form).hidden = true; q('#fvpProg').hidden = true; done.hidden = false;
        window.scrollTo({ top: 0 });
        try { if (window.gtag) window.gtag('event', 'generate_lead', { method: 'fv_step_form', campaign: u }); if (window.fbq) window.fbq('track', 'Lead'); } catch (x) {}
      })
      .catch(function () { fail.textContent = '送信に失敗しました。時間をおいて再度お試しください。'; })
      .then(function () { send.disabled = false; send.textContent = 'ホームページ案を無料で受け取る'; });
  });
})();
