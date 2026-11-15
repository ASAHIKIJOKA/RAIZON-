// 東大阪サイトの「メインビュー作り直し」のテストページを作る(本番のトップ site/index.html は変えない)。
//   node tools/gen-test-fv.js   →  site/test-fv.html(メインビュー)と site/test-fv-form.html(質問の専用ページ)
// 検索に載せない・分析タグなし・どこからもリンクなし。
// 構成: スマホで「バッジ3つ → 価格つきの見出し → 契約不要 → 1問目(選ぶとURLが切り替わる)」。
// 1問目を選ぶと、専用ページ(test-fv-form.html?want=…)へ移り、残りの質問(業種 → 連絡先)に答える。
// 色・フォント・雰囲気(トンマナ)は、今のサイトのまま。専用のCSS/JSは test-fv.css / test-fv.js / test-fv-form.js。
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const V = 2; // テスト用CSS/JSの版(キャッシュ対策)
let h = fs.readFileSync(path.join(root, 'site/index.html'), 'utf8');

// 1. 今のメインビューから、h1・リード文・右側のビジュアル(PC用)を取り出す
const sec = h.match(/<section class="fv">[\s\S]*?<\/section>/);
if (!sec) throw new Error('メインビュー(<section class="fv">)が見つかりません');
const s = sec[0];
const h1 = (s.match(/<h1>[\s\S]*?<\/h1>/) || [])[0];
const lab = (s.match(/<div class="fv__lab">[\s\S]*?<\/div>/) || [])[0];
const lead = (s.match(/<p class="fv__lead">[\s\S]*?<\/p>/) || [])[0];
const tail = '\n  </div>\n</section>';
if (!h1 || !lab || !lead || !s.endsWith(tail)) throw new Error('メインビューの形が想定と違います');

// 1問目の選択肢(選ぶと、専用ページへ移る)。want の値は、専用ページ側で文言に直す。
const WANTS = [['new', '新しくホームページを作りたい'], ['redo', 'いまのホームページを作り直したい'], ['undecided', 'まだ決まっていない・相談したい']];
const link = ([k, t]) => `<a class="fv2__opt fv2__opt--link" href="test-fv-form.html?want=${k}" data-want="${k}"><i class="fv2__ci" aria-hidden="true"></i><span>${t}</span></a>`;

const hero = `<section class="fv fv2">
  <div class="fv2__in">
    <div class="fv2__badges" role="list" aria-label="料金のポイント">
      <div class="fv2__bd" role="listitem"><span class="fv2__bk">制作費</span><span class="fv2__bv"><b>0</b><i>円</i></span></div>
      <div class="fv2__bd" role="listitem"><span class="fv2__bk">月額（税抜）</span><span class="fv2__bv"><b>9,800</b><i>円〜</i></span></div>
      <div class="fv2__bd" role="listitem"><span class="fv2__bk">最低契約期間</span><span class="fv2__bv fv2__bv--t"><b>なし</b></span></div>
    </div>
    <div class="fv2__text">
      ${lab}
      ${h1}
      ${lead}
    </div>
    <div class="fv2__formwrap">
      <div class="fv2__ribbon">契約不要、入力は約1分</div>
      <div class="fv2__card" id="fvform">
        <div class="fv2__head">
          <p class="fv2__ct">ホームページ案を<span class="mk">無料</span>で作成</p>
          <img class="fv2__img" src="assets/shots/w-cafe2.webp" alt="ホームページ案のイメージ" width="880" height="621" loading="eager" decoding="async">
        </div>
        <div class="fv2__prog" aria-hidden="true"><i class="is-on"></i><i></i><i></i></div>
        <p class="fv2__q">今回つくりたいのは？ <span class="fv2__n">(1/3)</span></p>
        ${WANTS.map(link).join('\n        ')}
      </div>
    </div>
  </div>
</section>`;

h = h.replace(s, () => hero);

// 2. 検索に載せない・分析タグを外す(テストの操作が、広告や分析の数字に混ざらないように)
h = h.replace(/<title>/, '<title>【テスト】');
if (!/name="robots" content="noindex/.test(h)) h = h.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
h = h.replace(/<link rel="canonical"[^>]*>\n?/g, '').replace(/<meta property="og:url"[^>]*>\n?/g, '');
const head = h.slice(0, h.indexOf('</head>'));
const headClean = head.replace(/<script\b[^>]*>[\s\S]*?<\/script>\n?/g, (m) => (/googletagmanager|gtag\(|clarity|fbq\(/.test(m) ? '' : m));
h = headClean + h.slice(head.length);

// 3. 専用のCSS/JS、スマホのヘッダーの申し込みボタン
h = h.replace(/(<link rel="stylesheet" href="style\.css[^>]*>)/, `$1\n<link rel="stylesheet" href="test-fv.css?v=${V}">`);
h = h.replace(/(<script src="main\.js[^>]*><\/script>)/, `$1\n<script src="test-fv.js?v=${V}"></script>`);
h = h.replace('<button class="hd__btn"', '<a class="hd__ask" href="#fvform">【無料】ホームページ案を受け取る</a><button class="hd__btn"');
if (!/test-fv\.css/.test(h) || !/test-fv\.js/.test(h) || !/hd__ask/.test(h)) throw new Error('差し込みに失敗しました');
fs.writeFileSync(path.join(root, 'site/test-fv.html'), h);

// 4. 質問の専用ページ(余計なメニューなし。2/3 業種 → 3/3 連絡先)
const styleLink = (h.match(/<link rel="stylesheet" href="style\.css[^>]*>/) || [])[0];
const fontLinks = (h.match(/<link rel="preconnect"[^>]*>\n?/g) || []).join('') + ((h.match(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/) || [])[0] || '');
const BIZ = ['飲食・カフェ', '美容・サロン・整体', '工場・製造・建設', '医療・福祉・教育', 'その他'];
const opt = (name, v) => `<label class="fv2__opt"><input type="radio" name="${name}" value="${v}"><span>${v}</span></label>`;
const page = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>【テスト】無料ホームページ案作成フォーム｜RAIZON</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png?v=2">
${fontLinks}
${styleLink}
<link rel="stylesheet" href="test-fv.css?v=${V}">
</head>
<body class="fvp">
<header class="fvp__hd"><a href="test-fv.html" aria-label="RAIZON トップへ"><img src="assets/raizon-logo.webp" alt="RAIZON" width="69" height="48"></a></header>
<main class="fvp__main fv2">
  <form class="fvp__card" id="fvp" novalidate>
    <div class="fvp__top"><span class="fvp__num"><b id="fvpN">2</b> / 3</span><span class="fvp__ttl">無料ホームページ案を受け取る</span></div>
    <div class="fv2__prog" id="fvpProg" aria-hidden="true"><i class="is-on"></i><i class="is-on"></i><i></i></div>
    <div class="fv2__step" data-step="2">
      <h1 class="fvp__q">お仕事の業種は？</h1>
      <p class="fvp__sub">近いものを選んでください。</p>
      ${BIZ.map((b) => opt('biz', b)).join('\n      ')}
      <a class="fv2__back" id="fvpBack1" href="test-fv.html#fvform">← 前の画面に戻る</a>
    </div>
    <div class="fv2__step" data-step="3" hidden>
      <h1 class="fvp__q">ご連絡先を教えてください</h1>
      <p class="fvp__sub">ご入力いただいた内容をもとに、ホームページの案を無料でお作りします。</p>
      <label class="fv2__f"><span class="fv2__lab">お名前<span class="bdg bdg--req">必須</span></span><input type="text" name="name" autocomplete="name" placeholder="例）山田 太郎"><span class="fm__err" data-err="name"></span></label>
      <label class="fv2__f"><span class="fv2__lab">電話番号<span class="bdg bdg--req">必須</span></span><input type="tel" name="tel" autocomplete="tel" inputmode="tel" placeholder="例）06-0000-0000"><span class="fm__err" data-err="tel"></span></label>
      <label class="fv2__f"><span class="fv2__lab">メールアドレス<span class="bdg bdg--req">必須</span></span><input type="email" name="email" autocomplete="email" placeholder="例）info@example.com"><span class="fm__err" data-err="email"></span></label>
      <label class="fv2__f"><span class="fv2__lab">ご要望・ご質問<span class="bdg">任意</span></span><textarea name="note" rows="3" placeholder="例）お店の雰囲気、載せたい内容など"></textarea></label>
      <div class="hp" aria-hidden="true"><label>website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
      <div class="fm__agree"><label><input type="checkbox" name="agree"><span><a href="test-fv.html#privacy" target="_blank" rel="noopener">プライバシーポリシー</a>に同意する</span></label><span class="fm__err" data-err="agree"></span></div>
      <span class="fm__fail" role="alert" id="fvfail"></span>
      <button class="fv2__send" type="submit" id="fvsend">ホームページ案を無料で受け取る</button>
      <button type="button" class="fv2__back" id="fvpBack2">← 前の画面に戻る</button>
    </div>
    <div class="fv2__done" id="fvdone" role="status" hidden>
      <span class="done__ic">✓</span>
      <h2>送信が完了しました</h2>
      <p>ありがとうございます。ご入力いただいた内容をもとに、担当者よりご連絡いたします。</p>
      <a class="fv2__back" href="test-fv.html">トップへ戻る</a>
    </div>
  </form>
</main>
<script src="test-fv-form.js?v=${V}"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'site/test-fv-form.html'), page);
console.log('site/test-fv.html と site/test-fv-form.html を作りました');
