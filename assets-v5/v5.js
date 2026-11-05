// RAIZON サイト v5: メニュー / 業種タブ / お問い合わせフォーム
(function () {
  var tg = document.querySelector('.hd-tg'), nav = document.querySelector('.sp-nav');
  if (tg && nav) tg.addEventListener('click', function () {
    var o = nav.classList.toggle('open'); tg.setAttribute('aria-expanded', o ? 'true' : 'false');
  });

  document.querySelectorAll('[data-tabs]').forEach(function (box) {
    var btns = box.querySelectorAll('.chips button'), panes = box.querySelectorAll('.uc');
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('on'); });
        panes.forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on'); if (panes[i]) panes[i].classList.add('on');
      });
    });
  });

  document.querySelectorAll('[data-ftabs]').forEach(function (box) {
    var btns = box.querySelectorAll('.ftabs button'), panes = box.querySelectorAll('.fbox');
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('on'); });
        panes.forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on'); if (panes[i]) panes[i].classList.add('on');
      });
    });
  });

  document.querySelectorAll('.scw').forEach(function (w) {
    var sc = w.querySelector('.sc');
    w.querySelectorAll('.scn button').forEach(function (b) {
      b.addEventListener('click', function () { sc.scrollBy({ left: (+b.dataset.d) * 333, behavior: 'smooth' }); });
    });
  });

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

// 日本語の改行を、文節(まとまり)の途中で切れないようにする
// (iPhoneのSafariは、CSSだけでは文節改行ができないため、文節ごとに折り返し不可のまとまりにする)
(function () {
  if (!('Segmenter' in Intl)) return;
  var seg = new Intl.Segmenter('ja', { granularity: 'word' });
  var JP = /[぀-ヿ㐀-鿿]/;
  var ATTACH = /^(は|が|を|に|で|と|も|の|へ|や|か|ね|よ|な|て|た|だ|し|ば|ず|れ|い|く|う|り|さ|け|る|ん|から|まで|より|など|です|ます|でした|ました|ません|ない|たい|する|して|され|でき|ください|ほど|ごと|だけ|ので|のに|ながら|こと|もの|ため|ところ|さん|様|ます。|です。)$/;
  var CLOSE = /^[、。，．）」』】〉》！？…〜～ー・:：;；,.)\]]/;
  var OPEN = /[（「『【〈《(\[]$/;
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, SELECT: 1, OPTION: 1, SVG: 1, NOSCRIPT: 1, INPUT: 1 };

  var HIRA = /^[\u3041-\u3096ー]+$/, KATA = /^[\u30a1-\u30ffー]+$/;
  function groups(text) {
    var out = [];
    for (var s of seg.segment(text)) {
      var w = s.segment, last = out[out.length - 1];
      // ひらがなだけの語(助詞・語尾)は、直前の語にくっつける / 閉じ記号・数字・英字も直前に / 「ご」「お」は次の語に
      if (last !== undefined && ((HIRA.test(w) && w !== 'お' && w !== 'ご') || KATA.test(w) && /[\u30a1-\u30ffー]$/.test(last) || /^[\u3400-\u9fff]/.test(w) && /[A-Za-z0-9]$/.test(last) || /^[\u3400-\u9fff]{1,3}$/.test(w) && /[\u30a1-\u30ffー]$/.test(last) || KATA.test(w) && /^[\u3400-\u9fff]{1,3}$/.test(last) || CLOSE.test(w) || OPEN.test(last) || last === 'ご' || last === 'お' ||
          /^[0-9,.%円〜]+$/.test(w) && /[0-9]$/.test(last) || /^[A-Za-z0-9]+$/.test(w) && /[A-Za-z0-9]$/.test(last))) out[out.length - 1] = last + w;
      else out.push(w);
    }
    // 「→」「›」だけが次の行に残らないよう、直前の語にくっつける
    for (var i = out.length - 1; i > 0; i--) {
      if (/^[→›]$/.test(out[i])) {
        var j = i - 1; if (/^\s+$/.test(out[j]) && j > 0) { out[j - 1] += '\u00a0' + out[i]; out.splice(j, 2); i = j; } else { out[j] += out[i]; out.splice(i, 1); }
      }
    }
    return out;
  }

  function wrap(node) {
    var t = node.nodeValue;
    if (!JP.test(t) || t.trim().length < 6) return;
    var frag = document.createDocumentFragment(), host = frag;
    var d = getComputedStyle(node.parentNode).display;
    // flex/grid の直下に置くと、文節が1つずつ別の項目になってしまうため、1つの入れ物にまとめる
    if (/flex|grid/.test(d)) { host = document.createElement('span'); frag.appendChild(host); }
    groups(t).forEach(function (g) {
      if (/^\s+$/.test(g)) { host.appendChild(document.createTextNode(g)); return; }
      var sp = document.createElement('span'); sp.className = 'nb'; sp.textContent = g; host.appendChild(sp);
    });
    node.parentNode.replaceChild(frag, node);
  }

  function run(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        for (var p = n.parentNode; p && p !== root; p = p.parentNode) {
          if (SKIP[p.nodeName.toUpperCase()] || (p.classList && (p.classList.contains('nb') || p.classList.contains('ph') || p.classList.contains('wm') || p.classList.contains('dm')))) return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [], n;
    while ((n = w.nextNode())) nodes.push(n);
    nodes.forEach(wrap);
  }
  run(document.body);
})();

// 動く予約画面: 日付 → 時間 → 確定 を自動でくり返す(画面に見えている間だけ動く)
(function () {
  document.querySelectorAll('[data-bk]').forEach(function (bk) {
    var days = bk.querySelectorAll('.dd-day'), slots = bk.querySelectorAll('.dd-slot'), ok = bk.querySelector('.bk-ok'), pg = bk.querySelectorAll('.bk-pg i');
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var vis = true; if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(bk);
    function wait(ms) { return new Promise(function (r) { (function w() { setTimeout(function () { vis ? r() : w(); }, vis ? ms : 500); })(); }); }
    function reset() { days.forEach(function (d) { d.classList.remove('on'); }); slots.forEach(function (s) { s.classList.remove('on'); }); ok.classList.remove('show'); bk.classList.remove('done'); pg[3].classList.remove('on'); }
    var a1 = +bk.dataset.s1 || 0, a2 = +bk.dataset.s2 || 0;
    if (reduce) { days[a1].classList.add('on'); slots[a2].classList.add('on'); return; }
    (async function loop() {
      for (;;) {
        reset(); await wait(900);
        days[a1].classList.add('on'); await wait(1000);
        slots[a2].classList.add('on'); await wait(900);
        pg[3].classList.add('on'); ok.classList.add('show'); bk.classList.add('done'); await wait(2600);
      }
    })();
  });
})();

// 業種ストリップ: 右端までスクロールしたら、右の白いぼかしと案内を消す
(function () {
  document.querySelectorAll('[data-ind]').forEach(function (el) {
    var w = el.closest('.indw'), h = w && w.querySelector('.indhint');
    el.addEventListener('scroll', function () {
      var end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      w.classList.toggle('end', end);
      if (h && el.scrollLeft > 20) h.style.opacity = '.45';
    }, { passive: true });
  });
})();

// LINEの画面から動くデモ(トーク → メニューをタップ → シート → 確定 → クーポン/お知らせ)
(function () {
  document.querySelectorAll('[data-lp]').forEach(function (lp) {
    var script = JSON.parse(lp.getAttribute('data-script'));
    var stage = lp.querySelector('.lp-stage'), wrap = lp.querySelector('.lp-wrap');
    function fit() { var avail = lp.clientWidth || 330, sh = stage.offsetHeight || 700; var s = Math.min(1, (avail - 8) / 330, Math.max(0.6, (window.innerHeight - 250) / sh)); lp.style.setProperty('--s', s); wrap.style.height = Math.round(s * sh) + 'px'; }
    fit(); window.addEventListener('resize', fit);
    var msgs = lp.querySelector('.lp-msgs'), sheet = lp.querySelector('.lp-sheet'), tap = lp.querySelector('.lp-tap'), cap = lp.querySelector('.lp-cap');
    var steps = [].slice.call(sheet.querySelectorAll('.lp-st')), dots = [].slice.call(sheet.querySelectorAll('.lp-dots u')), btn = sheet.querySelector('.lp-btn');
    var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0.05 }).observe(lp);
    function sleep(ms) { return new Promise(function (res) { setTimeout(function w() { if (visible) res(); else setTimeout(w, 300); }, ms); }); }
    function add(html, cls) { var d = document.createElement('div'); d.className = 'lp-msg ' + cls; d.innerHTML = html; msgs.appendChild(d); while (msgs.children.length > 6) msgs.removeChild(msgs.firstChild); return d; }
    function typing() { var d = document.createElement('div'); d.className = 'lp-msg lp-typing'; d.innerHTML = '<i></i><i></i><i></i>'; msgs.appendChild(d); return sleep(650).then(function () { if (d.parentNode) d.parentNode.removeChild(d); }); }
    function tapAt(x, y) { tap.style.left = x + '%'; tap.style.top = y + '%'; tap.classList.remove('go'); void tap.offsetWidth; tap.classList.add('go'); }
    function caption(tag, text) { cap.classList.add('sw'); setTimeout(function () { cap.querySelector('b').textContent = tag; cap.querySelector('span').textContent = text; cap.classList.remove('sw'); }, 250); }
    function showStep(n) { steps.forEach(function (st, i) { st.classList.toggle('show', i === n - 1); }); dots.forEach(function (d, i) { d.classList.toggle('on', i < n); }); }
    function resetSheet() { sheet.classList.remove('open'); steps.forEach(function (st) { st.classList.remove('show'); st.querySelectorAll('.on').forEach(function (e) { e.classList.remove('on'); }); }); dots.forEach(function (d) { d.classList.remove('on'); }); btn && btn.classList.remove('press'); }
    function choose(n, g, idx) {
      var st = steps[n - 1], groups = [st.querySelectorAll('.lp-row, .lp-dates span'), st.querySelectorAll('.lp-slots span')];
      return sleep(650).then(function () { [].slice.call(groups[g]).forEach(function (e, i) { e.classList.toggle('on', i === idx); }); });
    }
    async function run(o) {
      switch (o[0]) {
        case 'bot': add(o[1], 'lp-bot'); break;
        case 'user': add(o[1], 'lp-user'); await sleep(350); break;
        case 'card': add(o[1], o[2]); break;
        case 'typing': await typing(); break;
        case 'tap': tapAt(o[1], o[2]); await sleep(500); break;
        case 'cap': caption(o[1], o[2]); break;
        case 'open': sheet.classList.add('open'); break;
        case 'close': sheet.classList.remove('open'); break;
        case 'step': showStep(o[1]); break;
        case 'choose': await choose(o[1], o[2], o[3]); break;
        case 'press': btn && btn.classList.add('press'); break;
        case 'slide': var c = msgs.querySelector('.lp-car-in'); if (c) c.style.transform = 'translateX(' + o[1] + 'px)'; break;
        case 'wait': await sleep(o[1]); break;
      }
    }
    function staticView() {
      var hello = script[0][1]; add(hello, 'lp-bot');
      script.forEach(function (o) { if (o[0] === 'card' && (o[2] === 'lp-conf')) add(o[1], o[2]); });
    }
    if (reduced || !window.Promise) { staticView(); return; }
    (async function loop() {
      for (;;) {
        msgs.innerHTML = ''; resetSheet();
        for (var i = 0; i < script.length; i++) { await run(script[i]); }
      }
    })();
  });
})();

// ウェルカムポップアップ: 開いた瞬間に出す(同じブラウザ画面では1回だけ)
(function () {
  var pop = document.getElementById('wpop'); if (!pop) return;
  var key = 'rz_wpop_seen', seen = false;
  try { seen = sessionStorage.getItem(key) === '1'; } catch (e) {}
  if (seen) return;
  var last;
  function close() { pop.hidden = true; document.documentElement.style.overflow = ''; try { sessionStorage.setItem(key, '1'); } catch (e) {} if (last && last.focus) last.focus(); }
  function open() { last = document.activeElement; pop.hidden = false; document.documentElement.style.overflow = 'hidden'; var cd = pop.querySelector('.wpop-card'); cd.setAttribute('tabindex', '-1'); cd.focus({ preventScroll: true }); }
  pop.querySelectorAll('[data-wp-close]').forEach(function (b) { b.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) { if (!pop.hidden && e.key === 'Escape') close(); });
  setTimeout(open, 350);
})();

// 旧ページ(申込・利用規約・リンク集など)から来た #price などのリンクを、新サイトの該当ページへつなぐ
(function () {
  var map = { '#price': '/service#price', '#case': '/cases', '#company': '/company', '#blog': '/blog-list', '#service': '#service' };
  var h = location.hash;
  if (h && map[h] && map[h] !== h && location.pathname === '/') location.replace(map[h]);
})();
