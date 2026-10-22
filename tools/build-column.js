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
  if (meta.thumbnail && !fs.existsSync(path.join(ROOT, 'site', meta.thumbnail))) errors.push(`${f}: thumbnail のファイルがありません (site/${meta.thumbnail})`);
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
  .replace(/<a href="#works"[^>]*>制作実績<\/a>/g, '')
  .replace(/href="#top"/g, `href="${base}"`)
  .replace(/href="#([a-z]+)"/g, `href="${base}#$1"`)
  .replace(/href="column\/"/g, `href="${base}column/"`)
  .replace(/href="industry\//g, `href="${base}industry/`)
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
<meta property="og:image" content="__SITE__/${o.ogImage || 'assets/ogp.png'}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(o.ld).replace(/</g, '\\u003c')}</script>
<link rel="icon" type="image/png" sizes="32x32" href="${o.base}favicon-32.png?v=2">
<link rel="icon" type="image/png" sizes="48x48" href="${o.base}favicon-48.png?v=2">
<link rel="icon" type="image/png" sizes="192x192" href="${o.base}favicon-192.png?v=2">
<link rel="shortcut icon" href="${o.base}favicon.ico?v=2">
<link rel="apple-touch-icon" href="${o.base}apple-touch-icon.png?v=2">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="${o.base}style.css?v=${ver}">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-44W88GPXV5"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-44W88GPXV5");</script>
<script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","z1oezpeik6");</script>
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

const card = (p, base) => `<a class="cl__c" href="${base}column/${p.id}/">${p.thumbnail ? `<span class="cl__th"><img src="${base}${p.thumbnail}" alt="" width="1200" height="630" loading="lazy" decoding="async"></span>` : ''}<span class="cl__cat">${esc(p.category)}</span><h2>${esc(p.title)}</h2><p>${esc(p.description)}</p><time datetime="${p.publishAt}">${fmt(p.publishAt)}</time></a>`;

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
    { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.publishAt, dateModified: p.updatedAt || p.publishAt, inLanguage: 'ja', mainEntityOfPage: url, url, image: `__SITE__/${p.thumbnail || 'assets/ogp.png'}`,
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
  ${p.thumbnail ? `<figure class="art__th"><img src="${base}${p.thumbnail}" alt="${esc(p.title)}" width="1200" height="630" decoding="async"></figure>` : ''}
  <div class="art__b">${p.body}</div>
  ${cta(base)}
  ${others.length ? `<section class="art__more"><h2>ほかのコラム</h2><div class="cl__g">${others.map((x) => card(x, base)).join('')}</div></section>` : ''}
  <p class="art__back"><a href="${base}column/">← コラム一覧へ</a></p>
</div></article>`;
  fs.mkdirSync(path.join(OUT, p.id), { recursive: true });
  fs.writeFileSync(path.join(OUT, p.id, 'index.html'), head({ path: `/column/${p.id}/`, base, title: `${p.title}｜RAIZON`, desc: p.description, og: 'article', ogImage: p.thumbnail, main, ld }));
}
console.log(`コラム: ${live.length}本 → site/column/`);

// ---- 業種別ページ(content/pages/*.json → site/<path>/index.html) ----
const PSRC = path.join(ROOT, 'content', 'pages');
const pfiles = fs.existsSync(PSRC) ? fs.readdirSync(PSRC).filter((f) => f.endsWith('.json')).sort() : [];
const pages = [];
const perr = [];
for (const f of pfiles) {
  let p; try { p = JSON.parse(fs.readFileSync(path.join(PSRC, f), 'utf8')); } catch (e) { perr.push(`${f}: JSONが読めません`); continue; }
  if (!/^[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(p.path || '')) perr.push(`${f}: path は英小文字・数字・ハイフン・スラッシュのみ`);
  if (!p.title || p.title.length > 60) perr.push(`${f}: title は60文字まで`);
  if (!p.description || p.description.length < 50 || p.description.length > 130) perr.push(`${f}: description は50〜130文字(いま ${(p.description || '').length} 文字)`);
  if (!p.illust || !fs.existsSync(path.join(ROOT, 'site', 'assets', 'illust-t', p.illust[0] + '.webp'))) perr.push(`${f}: illust のファイルがありません`);
  pages.push(p);
}
if (perr.length) { console.error(perr.join('\n')); process.exit(1); }
fs.rmSync(path.join(ROOT, 'site', 'industry'), { recursive: true, force: true });
const pagesSorted = pages.sort((a, b) => Number(a.order || 99) - Number(b.order || 99));
const ICONS = {
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  route: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H14a3 3 0 010 6h-4a3 3 0 000 6h5.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  menu: '<path d="M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  heart: '<path d="M12 20s-8-4.9-8-10.5A4.5 4.5 0 0112 7a4.5 4.5 0 018 2.5C20 15.1 12 20 12 20z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  yen: '<circle cx="12" cy="12" r="9"/><path d="M8.5 7.5L12 12l3.5-4.5M12 12v5M9 13h6M9 15.5h6"/>'
};
const icon = (k) => `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ICONS.star}</svg>`;
const TIW = { design: [696, 554], wallet: [710, 678], consult: [752, 588], chat: [800, 416], bow: [440, 674] };
for (const p of pagesSorted) {
  const depth = p.path.split('/').length;
  const base = '../'.repeat(depth);
  const url = `__SITE__/${p.path}/`;
  const others = pagesSorted.filter((x) => x.id !== p.id);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebPage', name: p.title, description: p.description, url, inLanguage: 'ja', dateModified: p.updatedAt || p.publishAt, isPartOf: { '@type': 'WebSite', name: 'RAIZON', url: '__SITE__/' } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: '__SITE__/' },
      { '@type': 'ListItem', position: 2, name: p.name, item: url } ] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) }
  ];
  const [ik, iw, ih] = p.illust;
  const stp = (label, title) => `<div class="st"><div class="st__label">${label}</div><h2>${title}</h2></div>`;
  const main = `<section class="ip-hero">
  <div class="ip-hero__in">
    <div class="ip-hero__l">
      <nav class="ip-bc" aria-label="パンくずリスト"><a href="${base}">ホーム</a><span>/</span><span>${esc(p.name)}</span></nav>
      <div class="fv__lab">${esc(p.label)}</div>
      <h1>${p.h1}</h1>
      <p class="fv__lead">${esc(p.lead)}</p>
      <div class="ip-chips"><span class="tag-k">月額 9,800円（税抜）</span><span class="tag-k">最低契約期間なし</span><span class="tag-k">6ページ構成</span></div>
      <div class="fv__btns"><a class="btn" href="${base}#contact">無料相談・資料請求<i>→</i></a><a class="btn btn--line" href="${base}#price">料金を見る<i>→</i></a></div>
    </div>
    <div class="ip-hero__r"><div class="ip-circle"><img src="${base}assets/illust-t/${ik}.webp" alt="${esc(p.name)}のイラスト" width="${iw}" height="${ih}" decoding="async"></div><i class="ip-dot ip-dot--y" aria-hidden="true"></i><i class="ip-dot ip-dot--b" aria-hidden="true"></i></div>
  </div>
</section>
<section class="sec sec--tint"><div class="wrap">
  ${stp('こんなお悩み', 'こんなこと、ありませんか？')}
  <div class="ip-w">${p.worries.map(([t, k]) => `<div class="ip-w__c"><div class="ip-w__ic"><img src="${base}assets/illust-t/${k}.webp" alt="" width="${TIW[k][0]}" height="${TIW[k][1]}" loading="lazy" decoding="async"></div><p>${esc(t)}</p></div>`).join('')}</div>
  <p class="ip-ans">それ、<span class="mk2">RAIZONにおまかせください。</span></p>
</div></section>
<section class="sec"><div class="wrap">
  ${stp('載せる内容', 'ホームページで、伝えたいこと')}
  <ul class="ip-i">${p.info.map(([k, t, s], i) => `<li><span class="ip-i__ic">${icon(k)}</span><b>${esc(t)}</b><small>${esc(s)}</small></li>`).join('')}</ul>
  <p class="ip-note">文章や写真が、そろっていなくても大丈夫です。お聞きしながら、一緒に整理します。</p>
</div></section>
<section class="sec sec--gray"><div class="wrap">
  ${stp('ご利用の流れ', '3ステップで、公開まで')}
  <ol class="ip-s"><li><span>1</span><b>無料相談</b><small>お悩みを聞かせてください</small></li><li><span>2</span><b>制作</b><small>文章づくりも、お手伝いします</small></li><li><span>3</span><b>公開・更新</b><small>月4回まで、修正OK</small></li></ol>
  <div class="ip-price"><div><small>初期制作費</small><b>0<i>円</i></b></div><div><small>月額（税抜）</small><b>9,800<i>円</i></b></div><div><small>ページ数</small><b>6<i>ページ</i></b></div><div><small>最低契約期間</small><b>なし</b></div></div>
  <p class="ip-note">メールフォーム・Googleマップ・独自ドメイン・SSL・サーバー管理まで、月額に含まれます。<br>月払いの場合は、初回に契約手数料5,000円（税抜）がかかります。</p>
</div></section>
<section class="sec"><div class="wrap ip-faq">
  ${stp('よくある質問', 'はじめての方へ')}
  <div class="ip-faq__l">${p.faq.map((x) => `<details><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join('')}</div>
</div></section>
<section class="cta"><div class="cta__in"><div class="cta__t"><h2><span class="inline">まずは、</span><span class="inline">話を聞かせてください</span></h2><p>相談したからといって、契約をすすめることはありません。</p><div class="cta__b"><a class="btn" href="${base}#contact">無料相談・資料請求<i>→</i></a><a class="btn btn--o" href="${base}#price">料金を見る<i>→</i></a></div></div><div class="cta__p cta__p--il"><div class="cta__c ip-cc"><img src="${base}assets/illust-t/consult.webp" alt="打ち合わせのイラスト" width="752" height="588" loading="lazy" decoding="async"></div></div></div></section>
<section class="sec sec--tint"><div class="wrap">
  ${stp('ほかの業種', 'ほかの業種のご案内')}
  <div class="ip-o">${others.map((x) => `<a href="${base}${x.path}/"><img src="${base}assets/illust-t/${x.illust[0]}.webp" alt="" width="${x.illust[1]}" height="${x.illust[2]}" loading="lazy" decoding="async"><b>${esc(x.name)}</b><span>${'→'}</span></a>`).join('')}</div>
  <p class="art__back"><a href="${base}">← トップページへ</a></p>
</div></section>`;
  fs.mkdirSync(path.join(ROOT, 'site', p.path), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'site', p.path, 'index.html'), head({ path: `/${p.path}/`, base, title: p.title + '｜RAIZON', desc: p.description, main, ld }));
}
console.log(`ページ: ${pagesSorted.length}枚 → site/(industry/ ほか)`);

