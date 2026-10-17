(function () {
  'use strict';

  /* ===== 制作実績（掲載許可が取れた会社だけ追加する） =====
     0社のときは「制作実績」セクションごと非表示になる（ナビのリンクも消える）。
     WORKS:   { name, desc, img }  img はPC・スマホ表示の画像パス（例: 'assets/works/foo.webp'）
     MOCKUPS: スマホ表示の画像パスの配列。空なら「スマホで見ると」の帯だけ非表示。
     確認用: URLに ?placeholder=1 を付けると仮枠で表示する。 */
  var WORKS = [];
  /* SHOWCASE: スマホ表示画像を流す帯。phone1〜8.webp の順に流れる。暗い配色(2,4,7番)を離して並べてある。6番はおきりぶ(HTML版)のスマホ画面 */
  var SHOWCASE = []; /* ファーストビュー下の「制作イメージ」に統合したため、ここは空(実績が増えたら WORKS に追加する) */
  var MOCKUPS = [];

  /* ===== 日本語の改行を文節ごとにそろえる（Safari等で語の途中や括弧の途中で折り返さないため） =====
     Intl.Segmenter で単語に分け、助詞・助動詞・数字の単位・句読点・括弧を前後にくっつけて「折り返してよい単位」にする。 */
  var PHRASE_OK = typeof Intl !== 'undefined' && Intl.Segmenter;
  var seg = PHRASE_OK ? new Intl.Segmenter('ja', { granularity: 'word' }) : null;
  var TAIL = /^(は|が|を|に|へ|と|で|も|の|や|か|ね|よ|な|から|まで|より|など|です|ます|でし|まし|ませ|ん|た|て|れ|られ|せ|ず|ない|たい|ください|ませんか|ませ|せん|せんか|ましょう|ましょ|う|ま|できます|います|ありません|ので|のに|けど|けれど|だけ|ほど|しか|さん|こと|もの|円|%|％|ヶ|ヵ|か月|年|月|日|回|件|社|名|時間|分|人|点|つ|ほか|ごと|中|的|化|後|前)$/;
  var CLOSE = /^[、。，．！？!?…・」）)』】〕％%]+$/;
  var OPEN = /^[「（(『【〔]+$/;
  function chunk(text) {
    var toks = [], it = seg.segment(text);
    for (var s of it) toks.push(s.segment);
    var groups = [], i;
    for (i = 0; i < toks.length; i++) {
      var t = toks[i], g = groups[groups.length - 1];
      if (g && g.open) g.t += t, g.open = false;
      else if (g && (CLOSE.test(t) || TAIL.test(t))) g.t += t;
      else if (OPEN.test(t) || /^(お|ご|御)$/.test(t)) groups.push({ t: t, open: true });
      // 活用語尾・送り仮名など、短いひらがなは直前にくっつける（長くなりすぎない範囲で）
      else if (g && /^[\u3041-\u309f]{1,2}$/.test(t) && g.t.length < 9 && !/[、。！？…」）)』】]$/.test(g.t)) g.t += t;
      else if (g && /^[0-9,.]+$/.test(g.t.slice(-1)) && /^[0-9,.]+$/.test(t)) g.t += t;
      else groups.push({ t: t });
    }
    // 括弧の中身は、短ければ丸ごと1単位にする
    var out = [];
    for (i = 0; i < groups.length; i++) {
      var x = groups[i];
      if (/^[（(]/.test(x.t) && !/[）)]$/.test(x.t)) {
        var j = i, acc = x.t;
        while (j + 1 < groups.length && !/[）)]$/.test(acc) && acc.length < 26) { j++; acc += groups[j].t; }
        if (/[）)]$/.test(acc) && acc.length <= 26) { out.push(acc); i = j; continue; }
      }
      out.push(x.t);
    }
    // 漢字1文字だけの単位（例:「手」+「伝って」）は、次の単位とつなげる
    var merged = [];
    for (i = 0; i < out.length; i++) {
      if (out[i].length === 1 && /[\u4e00-\u9fff]/.test(out[i]) && i + 1 < out.length && out[i].length + out[i + 1].length <= 8 && !CLOSE.test(out[i + 1])) { merged.push(out[i] + out[i + 1]); i++; }
      else merged.push(out[i]);
    }
    return merged;
  }
  function phrasify(root) {
    if (!PHRASE_OK || !root) return;
    var skip = 'script,style,textarea,select,option,svg,.hp,.ph,.tk,.mq,[data-nophrase],.phr,.phw';
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [], n;
    while ((n = w.nextNode())) {
      var p = n.parentElement;
      if (!p || p.closest(skip)) continue;
      if (n.nodeValue.trim().length < 6 || !/[\u3040-\u30ff\u4e00-\u9fff]/.test(n.nodeValue)) continue;
      nodes.push(n);
    }
    nodes.forEach(function (n) {
      // flex/grid の中でも1つの要素として扱われるよう、必ず1つの外枠(span.phw)に包む
      var parts = chunk(n.nodeValue), wrap = document.createElement('span');
      wrap.className = 'phw';
      parts.forEach(function (t) { var s = document.createElement('span'); s.className = 'phr'; s.textContent = t; wrap.appendChild(s); });
      n.parentNode.replaceChild(wrap, n);
    });
  }

  var q = function (s, r) { return (r || document).querySelector(s); };
  var qa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ===== ヘッダーのメニュー ===== */
  var hd = q('#hd'), hdBtn = q('#hdBtn');
  function setMenu(open) {
    hd.classList.toggle('open', open);
    hdBtn.setAttribute('aria-expanded', open);
    hdBtn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  }
  hdBtn.addEventListener('click', function () { setMenu(!hd.classList.contains('open')); });
  qa('#hdPanel a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) setMenu(false); });

  /* ===== 制作実績 ===== */
  (function () {
    var preview = /[?&]placeholder=1/.test(location.search);
    var works = WORKS.slice(), mocks = MOCKUPS.slice(), shows = SHOWCASE.slice();
    if (!works.length && preview && !shows.length) {
      for (var i = 1; i <= 5; i++) works.push({ name: '［制作実績 ' + i + '］', desc: '［制作内容の説明］', img: '' });
      for (var j = 1; j <= 8; j++) mocks.push('');
    }
    if (!works.length && !mocks.length && !shows.length) {
      qa('#works,[data-nav="works"]').forEach(function (el) { el.hidden = true; });
      return;
    }
    var ph = function (t) { return '<div class="ph" aria-hidden="true"><span>' + t + '</span></div>'; };
    // 2周分を並べてCSSで左へ流す。1周が画面幅を超えるまで同じ並びを繰り返す
    var loop = function (html, minRep) { var one = ''; for (var r = 0; r < minRep; r++) one += html(false); var two = ''; for (var r2 = 0; r2 < minRep; r2++) two += html(true); return one + two; };
    q('#works').hidden = false;

    if (shows.length) {
      var rep = Math.max(1, Math.ceil(10 / shows.length));
      q('#showMq').innerHTML = loop(function (dup) {
        return shows.map(function (s) {
          return '<img class="showcase__i" src="' + esc(s.src) + '" alt="' + (dup ? '' : esc(s.alt)) + '"' + (dup ? ' aria-hidden="true"' : '') + ' width="' + s.w + '" height="' + s.h + '" loading="lazy">';
        }).join('');
      }, rep);
      q('#showcase').hidden = false;
    }
    if (works.length) {
      var card = function (w, n, dup) {
        return '<article class="wk"' + (dup ? ' aria-hidden="true"' : '') + '><div class="frame r-16-10">' +
          (w.img ? '<img src="' + esc(w.img) + '" alt="' + esc(w.name) + 'のホームページ" loading="lazy">' : ph('制作実績 ' + n + '：PC・スマホ表示画像')) +
          '</div><div class="wk__pl">STANDARD（月額9,800円）</div><h3>' + esc(w.name) + '</h3><p>' + esc(w.desc) + '</p></article>';
      };
      q('#worksMq').innerHTML = loop(function (dup) { return works.map(function (w, i) { return card(w, i + 1, dup); }).join(''); }, Math.max(1, Math.ceil(4 / works.length)));
    } else {
      q('#worksTrack').hidden = true;
    }
    if (mocks.length) {
      var m = function (src, n, dup) {
        return '<div class="mock__i"' + (dup ? ' aria-hidden="true"' : '') + '>' +
          (src ? '<img src="' + esc(src) + '" alt="スマートフォンでの表示例" loading="lazy">' : ph('スマホ表示デザイン例 ' + n)) + '</div>';
      };
      q('#mockMq').innerHTML = loop(function (dup) { return mocks.map(function (s, i) { return m(s, i + 1, dup); }).join(''); }, Math.max(1, Math.ceil(8 / mocks.length)));
      q('#mockWrap').hidden = false;
    }
  })();

  /* ===== できること（カードを押すと、その行の下に詳細が開く。1つだけ開く） ===== */
  (function () {
    var box = q('#fcards'); if (!box || !window.FEATURES) return;
    var cards = qa('.fc', box), panel = null, openI = -1;
    var cols = function () { return getComputedStyle(box).gridTemplateColumns.split(' ').length; };
    function close() {
      if (panel) { panel.remove(); panel = null; }
      cards.forEach(function (c) { c.classList.remove('is-open'); c.setAttribute('aria-expanded', 'false'); q('.fc__txt', c).textContent = '詳しく見る'; });
      openI = -1;
    }
    function open(i) {
      close();
      var c = cards[i], n = cols(), rowEnd = Math.min(cards.length - 1, Math.floor(i / n) * n + n - 1);
      c.classList.add('is-open'); c.setAttribute('aria-expanded', 'true'); q('.fc__txt', c).textContent = '閉じる';
      panel = document.createElement('div'); panel.className = 'fd'; panel.id = 'fd'; panel.setAttribute('role', 'region');
      var h = document.createElement('h3'); h.textContent = window.FEATURES[i].t;
      var p = document.createElement('p'); p.textContent = window.FEATURES[i].b;
      panel.appendChild(h); panel.appendChild(p);
      cards[rowEnd].after(panel); phrasify(panel); openI = i;
    }
    cards.forEach(function (c, i) { c.addEventListener('click', function () { if (openI === i) close(); else open(i); }); });
    var lastCols = cols();
    window.addEventListener('resize', function () { var n = cols(); if (n !== lastCols) { lastCols = n; close(); } });
  })();

  /* ===== よくある質問 ===== */
  (function () {
    var groups = window.FAQ || [], tab = 0, openIdx = -1;
    var tabs = q('#faqTabs'), list = q('#faqList');
    function render() {
      tabs.innerHTML = groups.map(function (g, i) {
        return '<button type="button" class="fq__tab" role="tab" aria-selected="' + (i === tab) + '" data-i="' + i + '">' + esc(g.label) + '</button>';
      }).join('');
      list.innerHTML = groups[tab].items.map(function (it, i) {
        var o = i === openIdx;
        return '<div><button type="button" class="fq__q" aria-expanded="' + o + '" data-i="' + i + '"><span><em>Q</em>' + esc(it[0]) + '</span><span class="ic">' + (o ? '−' : '＋') + '</span></button>' +
          (o ? '<p class="fq__a">' + esc(it[1]) + '</p>' : '') + '</div>';
      }).join('');
      phrasify(tabs); phrasify(list);
    }
    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('.fq__tab'); if (!b) return;
      tab = +b.dataset.i; openIdx = -1; render();
    });
    list.addEventListener('click', function (e) {
      var b = e.target.closest('.fq__q'); if (!b) return;
      var i = +b.dataset.i; openIdx = openIdx === i ? -1 : i; render();
    });
    render();
  })();

  /* ===== お問い合わせフォーム ===== */
  (function () {
    var form = q('#form'), done = q('#done'), fail = q('#fail'), send = q('#send');
    var ENDPOINT = '/api/contact';
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var setErr = function (k, msg) {
      var el = q('[data-err="' + k + '"]'); if (el) el.textContent = msg || '';
      var inp = form.elements[k];
      if (inp && inp.type !== 'checkbox') inp.classList.toggle('is-err', !!msg);
    };
    var val = function (k) { return (form.elements[k].value || '').trim(); };
    function validate() {
      var e = {};
      if (!val('name')) e.name = 'お名前を入力してください';
      if (!val('email')) e.email = 'メールアドレスを入力してください';
      else if (!EMAIL.test(val('email'))) e.email = 'メールアドレスの形式が正しくありません';
      if (!val('message')) e.message = 'お問い合わせ内容を入力してください';
      if (!form.elements.agree.checked) e.agree = 'プライバシーポリシーへの同意が必要です';
      return e;
    }
    ['name', 'email', 'tel', 'company', 'message', 'agree'].forEach(function (k) {
      var el = form.elements[k];
      el.addEventListener(k === 'agree' ? 'change' : 'input', function () { setErr(k, ''); });
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var e = validate();
      ['name', 'email', 'message', 'agree'].forEach(function (k) { setErr(k, e[k]); });
      if (Object.keys(e).length) { var first = q('.is-err', form); if (first) first.focus(); return; }
      fail.textContent = ''; send.disabled = true; send.textContent = '送信中…';
      var body = {
        kind: form.elements.kind.value, company: val('company'), name: val('name'), email: val('email'),
        tel: val('tel'), budget: val('budget'), message: val('message'), agree: true,
        website: form.elements.website.value, source: 'osaka-home' + (document.referrer ? ' / ' + document.referrer : '')
      };
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); form.hidden = true; done.hidden = false; })
        .catch(function () { fail.textContent = '送信に失敗しました。時間をおいて再度お試しください。'; })
        .then(function () { send.disabled = false; send.textContent = '入力内容を送信する'; });
    });
    q('#again').addEventListener('click', function () { form.reset(); done.hidden = true; form.hidden = false; });
  })();

  phrasify(document.querySelector('main')); phrasify(document.querySelector('footer'));

  /* ===== スクロール出現 ===== */
  (function () {
    if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var sel = 'main section h1, main section h2, main section h3, main section p, main section li, main section article, main section table, main section iframe, main section .frame, main section [data-pop]';
    var play = function (el) {
      var pop = el.hasAttribute('data-pop');
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      var a = el.animate(pop
        ? [{ opacity: 0, transform: 'scale(.85) rotate(-2deg)' }, { opacity: 1, transform: 'scale(1.03) rotate(.5deg)', offset: .7 }, { opacity: 1, transform: 'none' }]
        : [{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'none' }],
        { duration: pop ? 620 : 760, delay: Math.min(sib, 6) * 70, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
      el.style.opacity = '';
      a.onfinish = function () { el.style.opacity = ''; };
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); play(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    qa(sel).forEach(function (el) {
      if (el.closest('[aria-hidden="true"]') || el.closest('form') || el.closest('[hidden]') || el.closest('.mq')) return;
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) { play(el); return; }
      el.style.opacity = '0';
      io.observe(el);
    });
  })();
})();
