// コラム(ブログ)を、静的なHTMLとして作る。
//   node tools/build-column.js
// 記事の元: content/column/*.html (先頭に <!--meta ... --> で id / title / description / category / publishAt を書く)
// 出力:     site/column/index.html (一覧) と site/column/<id>/index.html (記事)
// ヘッダー・フッターは site/index.html から取り出して、リンクの向きだけ直して使う(トップと見た目をそろえる)。
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'content', 'column');
const OUT = path.join(ROOT, 'site', 'column');
const index = fs.readFileSync(path.join(ROOT, 'site', 'index.html'), 'utf8');

const ver = (index.match(/style\.css\?v=(\d+)/) || [, '1'])[1];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (d) => d.replace(/-/g, '.');
const CATS = ['料金・費用', '制作の基礎', '集客・運用', 'お知らせ'];

// ---- 記事を読む ----
const files = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter((f) => f.endsWith('.html')).sort() : [];
const posts = [];
const errors = [];
for (const f of files) {
  const raw = fs.readFileSync(path.join(SRC, f), 'utf8').replace(/\r\n/g, '\n');
  const m = raw.match(/^<!--meta\n([\s\S]*?)-->\n?/);
  if (!m) { errors.push(`${f}: 先頭の <!--meta ... --> がありません`); continue; }
  const meta = {};
  for (const l of m[1].split('\n')) { const i = l.indexOf(':'); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
  const body = raw.slice(m[0].length).trim();
  if (!/^[a-z0-9-]{1,64}$/.test(meta.id || '')) errors.push(`${f}: id は英小文字・数字・ハイフンのみ`);
  if (!meta.title) errors.push(`${f}: title がありません`);
  if (!meta.description || meta.description.length < 50 || meta.description.length > 130) errors.push(`${f}: description は50〜130文字(いま ${(meta.description || '').length} 文字)`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.publishAt || '')) errors.push(`${f}: publishAt は YYYY-MM-DD`);
  if (!CATS.includes(meta.category)) errors.push(`${f}: category は ${CATS.join('/')}`);
  if (posts.some((p) => p.id === meta.id)) errors.push(`${f}: id が重複 (${meta.id})`);
  if (body.replace(/<[^>]*>/g, '').length < 900) errors.push(`${f}: 本文が短すぎます`);
  posts.push({ ...meta, body, file: f });
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); // 日本時間の今日
const live = posts.filter((p) => p.publishAt <= today).sort((a, b) => (a.publishAt < b.publishAt ? 1 : -1));

// ---- 共通部品(ヘッダー・フッター)をトップから取り出す ----
const header0 = index.match(/<header class="hd" id="hd">[\s\S]*?<\/header>/)[0];
const footer0 = index.match(/<footer class="ftr">[\s\S]*?<\/footer>/)[0];
const spcta0 = index.match(/<div class="sp-spacer"><\/div>\s*<div class="sp-cta">[\s\S]*?<\/div>/)[0];
const fix = (html, base) => html
  .replace(/href="#top"/g, `href="${base}"`)
  .replace(/href="#([a-z]+)"/g, `href="${base}#$1"`)
  .replace(/href="column\/"/g, `href="${base}column/"`)
  .replace(/src="assets\//g, `src="${base}assets/`)
  .replace(/ data-nav="works"/g, '');

const head = (o) => `<!DOCTYPE html>
<html lang="ja" data-path="${o.path}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<!-- 公開前のため検索エンジンに載せない。SITE_URL を付けて build-osaka.js を実行すると、公開用に切り替わる -->
<meta name="robots" content="noindex, nofollow">
<meta property="og:type" content="${o.og || 'website'}">
<meta property="og:locale" content="ja_JP">
<meta property="og:site_name" content="RAIZON">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<script type="application/ld+json">${JSON.stringify(o.ld).replace(/</g, '\\u003c')}</script>
<link rel="icon" href="${o.base}favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="${o.base}favicon-32.png">
<link rel="apple-touch-icon" href="${o.base}apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="${o.base}style.css?v=${ver}">
</head>
<body>
${fix(header0, o.base)}
<main>
${o.main}
</main>
${fix(footer0, o.base)}
${fix(spcta0, o.base)}
<script src="${o.base}column.js?v=${ver}"></script>
</body>
</html>
`;

const cta = (base) => `<aside class="art__cta">
  <p class="art__cta-t">ホームページのことで、気軽に相談したい方へ</p>
  <p class="art__cta-s">初期制作費0円・月額9,800円（税抜）、6ページ構成。相談したからといって、契約をすすめることはありません。</p>
  <div class="art__cta-b"><a class="btn" href="${base}#contact">無料相談・資料請求<i>→</i></a><a class="btn btn--o" href="${base}#price">料金を見る<i>→</i></a></div>
</aside>`;

const card = (p, base) => `<a class="cl__c" href="${base}column/${p.id}/"><span class="cl__cat">${esc(p.category)}</span><h2>${esc(p.title)}</h2><p>${esc(p.description)}</p><time datetime="${p.publishAt}">${fmt(p.publishAt)}</time></a>`;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// ---- 一覧 ----
{
  const base = '../';
  const main = `<section class="sec sec--tint cl__top"><div class="wrap">
  <div class="st"><div class="st__label">コラム</div><h1>ホームページのこと、わかりやすく</h1></div>
  <p class="cl__lead">個人事業主・中小企業の方が、ホームページを持つときに迷いやすいことを、東大阪のホームページ制作会社RAIZONが、やさしく解説します。</p>
</div></section>
<section class="sec"><div class="wrap">
  ${live.length ? `<div class="cl__g">${live.map((p) => card(p, base)).join('')}</div>` : '<p class="cl__empty">コラムは準備中です。</p>'}
</div></section>
<section class="sec sec--gray"><div class="wrap">${cta(base)}</div></section>`;
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'コラム｜RAIZON', url: '__SITE__/column/', isPartOf: { '@type': 'WebSite', name: 'RAIZON', url: '__SITE__/' } };
  fs.writeFileSync(path.join(OUT, 'index.html'), head({ path: '/column/', base, title: 'コラム｜東大阪のホームページ制作 RAIZON', desc: '個人事業主・中小企業のホームページの費用、選び方、準備のしかたを、東大阪のホームページ制作会社RAIZONがやさしく解説するコラムです。', main, ld }));
}

// ---- 記事 ----
for (const p of live) {
  const base = '../../';
  const others = live.filter((x) => x.id !== p.id).slice(0, 3);
  const url = `__SITE__/column/${p.id}/`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.publishAt, dateModified: p.updatedAt || p.publishAt, inLanguage: 'ja', mainEntityOfPage: url, url, image: '__SITE__/assets/ogp.png',
      author: { '@type': 'Organization', name: 'RAIZON', url: '__SITE__/' }, publisher: { '@type': 'Organization', name: 'RAIZON', url: '__SITE__/', logo: { '@type': 'ImageObject', url: '__SITE__/apple-touch-icon.png' } } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: '__SITE__/' },
      { '@type': 'ListItem', position: 2, name: 'コラム', item: '__SITE__/column/' },
      { '@type': 'ListItem', position: 3, name: p.title, item: url } ] }
  ];
  // よくある質問(h2「よくある質問」の下の h3 + p)を FAQPage の構造化データにする
  const fi = p.body.indexOf('<h2>よくある質問</h2>');
  if (fi >= 0) {
    const items = [];
    const re = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/g; let m;
    const sec = p.body.slice(fi);
    const strip = (t) => t.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    while ((m = re.exec(sec))) items.push({ '@type': 'Question', name: strip(m[1]), acceptedAnswer: { '@type': 'Answer', text: strip(m[2]) } });
    if (items.length) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items });
  }
  const main = `<article class="sec art"><div class="wrap art__w">
  <nav class="art__bc" aria-label="パンくずリスト"><a href="${base}">ホーム</a><span>/</span><a href="${base}column/">コラム</a><span>/</span><span>${esc(p.title)}</span></nav>
  <header class="art__h">
    <div class="art__meta"><span class="cl__cat">${esc(p.category)}</span><time datetime="${p.publishAt}">${fmt(p.publishAt)}</time></div>
    <h1>${esc(p.title)}</h1>
  </header>
  <div class="art__b">${p.body}</div>
  ${cta(base)}
  ${others.length ? `<section class="art__more"><h2>ほかのコラム</h2><div class="cl__g">${others.map((x) => card(x, base)).join('')}</div></section>` : ''}
  <p class="art__back"><a href="${base}column/">← コラム一覧へ</a></p>
</div></article>`;
  fs.mkdirSync(path.join(OUT, p.id), { recursive: true });
  fs.writeFileSync(path.join(OUT, p.id, 'index.html'), head({ path: `/column/${p.id}/`, base, title: `${p.title}｜RAIZON`, desc: p.description, og: 'article', main, ld }));
}
console.log(`コラム: ${live.length}本 → site/column/`);
