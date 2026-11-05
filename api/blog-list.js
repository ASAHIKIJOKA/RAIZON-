// ========================================
// SSR: ブログ一覧ページ
// Googlebot向けにサーバーサイドでHTMLを生成する
// ========================================

const { getPublishedPosts } = require('./_firebase');
const SHELL = require('./_v5-shell.json');

module.exports = async function handler(req, res) {
  let posts = [];
  try {
    posts = await getPublishedPosts();
  } catch (e) {
    console.error('Firebase fetch error:', e);
  }

  const categories = [...new Set(posts.map(p => p.category || 'お知らせ'))];
  const activeCategory = typeof req.query.category === 'string' ? req.query.category : '';
  const filteredPosts = activeCategory
    ? posts.filter(p => (p.category || 'お知らせ') === activeCategory)
    : posts;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.end(renderHtml(filteredPosts, categories, activeCategory));
};

// ----------------------------------------
// ユーティリティ
// ----------------------------------------
const THUMB_BY_CAT = { 'LINE構築': 'cat-line', 'DX支援': 'cat-dx', '制作実績': 'cat-case', 'お知らせ': 'cat-news', 'AI活用': 'cat-ai' };
function thumbOf(post) {
  if (post.thumbnail && /^https?:\/\//.test(post.thumbnail)) return post.thumbnail;
  return `/assets-v3/blog/${THUMB_BY_CAT[post.category] || 'cat-news'}.svg`;
}

function truncate(text, len) {
  // 冒頭の段落(<p>)を優先して使い、改行や余分な空白は詰める(検索結果の説明文・一覧の抜粋用)
  const p = text.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  const plain = (p ? p[1] : text).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return plain.length > len ? plain.substring(0, len) + '...' : plain;
}

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ----------------------------------------
// HTML テンプレート
// ----------------------------------------
function renderHtml(posts, categories, activeCategory) {
  const pageTitle = activeCategory ? `${activeCategory}の記事一覧 | RAIZON` : 'ブログ一覧 | RAIZON｜沖縄のDX・LINE・AI活用情報';
  const pageDesc = activeCategory
    ? `RAIZONの「${activeCategory}」カテゴリーの記事一覧。沖縄のDX支援・LINE構築・AI活用に関する最新情報・事例・ノウハウをお届けします。`
    : 'RAIZONのブログ一覧。沖縄のDX支援・LINE構築・AI活用に関する最新情報・事例・ノウハウをお届けします。';
  const canonicalUrl = activeCategory
    ? `https://raizon-okinawa.com/blog-list?category=${encodeURIComponent(activeCategory)}`
    : 'https://raizon-okinawa.com/blog-list';

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://raizon-okinawa.com/' },
    { '@type': 'ListItem', position: 2, name: 'ブログ一覧', item: 'https://raizon-okinawa.com/blog-list' }
  ];
  if (activeCategory) {
    breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: activeCategory, item: canonicalUrl });
  }
  const ldBreadcrumb = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems
  });

  const categoryTabsHtml = `
    <div class="bl-tabs" role="navigation" aria-label="カテゴリーで絞り込み">
      <a href="/blog-list" class="${activeCategory ? '' : 'on'}">すべて</a>
      ${categories.map(cat => `<a href="/blog-list?category=${encodeURIComponent(cat)}" class="${activeCategory === cat ? 'on' : ''}">${esc(cat)}</a>`).join('')}
    </div>`;

  const cardsHtml = posts.length === 0
    ? `<p style="text-align:center;color:#6B7280;padding:48px 0;">${activeCategory ? `「${esc(activeCategory)}」の記事は現在ありません。` : '現在、記事はありません。'}</p>`
    : `<div class="bl-cards">${posts.map(post => `
      <a class="bl-card" href="/blog/${esc(post.id)}" itemscope itemtype="https://schema.org/BlogPosting">
        <div class="th"><img src="${esc(thumbOf(post))}" alt="" loading="lazy" itemprop="image"></div>
        <span class="tag">${esc(post.category || 'お知らせ')}</span>
        <h2 itemprop="headline">${esc(post.title)}</h2>
        <time datetime="${new Date(post.createdAt).toISOString()}" itemprop="datePublished">${formatDate(post.createdAt)}</time>
        <meta itemprop="description" content="${esc(truncate(post.body || '', 80))}">
      </a>`).join('')}</div>`;

  const recentHtml = posts.slice(0, 5).map(post => `
      <a class="bl-rc" href="/blog/${esc(post.id)}"><img src="${esc(thumbOf(post))}" alt="" loading="lazy"><div><b>${esc(post.title)}</b><time>${formatDate(post.createdAt)}</time></div></a>`).join('');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-F7SZDCFSH7"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-F7SZDCFSH7');
  </script>
  <script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","vitwsmjicc");</script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(pageDesc)}">
  <meta property="og:title" content="${esc(pageTitle)}">
  <meta property="og:description" content="${esc(pageDesc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://raizon-okinawa.com/ogp-logo.png">
  <meta property="og:locale" content="ja_JP">
  <meta property="og:site_name" content="RAIZON">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(pageTitle)}">
  <meta name="twitter:description" content="${esc(pageDesc)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="icon" type="image/png" href="/favicon-32.png?v=2" sizes="32x32">
<link rel="icon" type="image/png" href="/favicon-48.png?v=2" sizes="48x48">
<link rel="icon" type="image/png" href="/favicon-192.png?v=2" sizes="192x192">
<link rel="shortcut icon" href="/favicon.ico?v=2">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets-v5/v5.css?v=8">
  <script type="application/ld+json">${ldBreadcrumb}</script>
<script>try{if(!localStorage.getItem('raizon_src')){var p=new URLSearchParams(location.search),r='';try{r=document.referrer?new URL(document.referrer).hostname:''}catch(e){}localStorage.setItem('raizon_src',[p.get('utm_source')||r||'direct',p.get('utm_medium')||'',p.get('utm_campaign')||'',location.pathname].join('|'))}}catch(e){}</script>
</head>
<body>
${SHELL.header}<main>
  <section class="ph2"><div class="wrap">
    <div class="crumb"><a href="/">トップ</a><i>／</i>ブログ</div>
    <h1>MEDIA</h1><div class="jp">${activeCategory ? esc(activeCategory) : 'ブログ｜LINEとデジタル活用のコラム'}</div>
    <p class="ds">LINE公式アカウント・ホームページ・業務のデジタル化について、沖縄の事業者さま向けに手順やヒントを公開しています。</p>
    <div class="wm" aria-hidden="true">MEDIA</div>
  </div></section>
  <div class="main"><div class="wrap">
    <div class="bl-grid">
      <div>
        ${categoryTabsHtml}
        ${cardsHtml}
      </div>
      <aside class="bl-side">
        <input class="bl-search" id="bl-q" type="search" placeholder="キーワードで記事を検索" aria-label="記事を検索">
        <div class="bl-sidehd">新着の記事</div>
        ${recentHtml}
      </aside>
    </div>
  </div></div>
</main>
${SHELL.footer}
<script>
(function(){var q=document.getElementById('bl-q');if(!q)return;q.addEventListener('input',function(){var v=q.value.trim().toLowerCase();document.querySelectorAll('.bl-card').forEach(function(c){c.style.display=(!v||c.textContent.toLowerCase().indexOf(v)>-1)?'':'none';});});})();
</script>
</body>
</html>`;
}
