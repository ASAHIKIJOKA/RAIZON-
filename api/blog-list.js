// ========================================
// SSR: ブログ一覧ページ
// Googlebot向けにサーバーサイドでHTMLを生成する
// ========================================

const { getPublishedPosts } = require('./_firebase');

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
    <div class="rz3-blog-cat-tabs" role="navigation" aria-label="カテゴリーで絞り込み">
      <a href="/blog-list" class="rz3-blog-cat-btn${activeCategory ? '' : ' on'}">すべて</a>
      ${categories.map(cat => `<a href="/blog-list?category=${encodeURIComponent(cat)}" class="rz3-blog-cat-btn${activeCategory === cat ? ' on' : ''}">${esc(cat)}</a>`).join('')}
    </div>`;

  const cardsHtml = posts.length === 0
    ? `<p style="text-align:center;color:#6B7280;padding:48px 0;">${activeCategory ? `「${esc(activeCategory)}」の記事は現在ありません。` : '現在、記事はありません。'}</p>`
    : `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:24px;">${posts.map(post => `
      <a class="rz3-blog-card" href="/blog/${esc(post.id)}" itemscope itemtype="https://schema.org/BlogPosting">
        <div class="rz3-blog-thumb"><img src="${esc(thumbOf(post))}" alt="" loading="lazy" itemprop="image"></div>
        <div class="rz3-blog-body">
          <div class="rz3-blog-meta"><span class="rz3-blog-cat">${esc(post.category || 'お知らせ')}</span><time class="rz3-blog-date" datetime="${new Date(post.createdAt).toISOString()}" itemprop="datePublished">${formatDate(post.createdAt)}</time></div>
          <h2 style="margin:0;font-size:17px;font-weight:700;line-height:1.7;" itemprop="headline">${esc(post.title)}</h2>
          <p style="margin:0;font-size:13px;line-height:1.9;color:#6B7280;" itemprop="description">${esc(truncate(post.body || '', 80))}</p>
        </div>
      </a>`).join('')}</div>`;

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
  <link rel="stylesheet" href="/site-v3.css?v=2">
  <script type="application/ld+json">${ldBreadcrumb}</script>
  <style>
    .rz3-blog-hero{background:linear-gradient(160deg,#146EF5 0%,#0B2E6B 100%);padding:64px 40px;text-align:center;color:#fff;}
    .rz3-blog-hero h1{font-size:clamp(1.6rem,3.5vw,2.2rem);font-weight:800;margin-bottom:10px;}
    .rz3-blog-hero p{font-size:1rem;opacity:.85;}
    .rz3-blog-cat-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:32px;}
  </style>
<script>try{if(!localStorage.getItem('raizon_src')){var p=new URLSearchParams(location.search),r='';try{r=document.referrer?new URL(document.referrer).hostname:''}catch(e){}localStorage.setItem('raizon_src',[p.get('utm_source')||r||'direct',p.get('utm_medium')||'',p.get('utm_campaign')||'',location.pathname].join('|'))}}catch(e){}</script>
</head>
<body class="rz3">
  <header class="rz3-header">
    <div class="rz3-header-in">
      <a href="/" class="rz3-logo"><img src="/assets-v3/raizon-logo.png" alt="RAIZON"></a>
      <nav class="rz3-nav">
        <div class="rz3-nav-links">
          <a href="/#service">サービス</a>
          <a href="/#price">料金</a>
          <a href="/#case">導入事例</a>
          <a href="/#company">会社概要</a>
          <a href="/blog-list">ブログ</a>
        </div>
        <a href="https://line.me/R/ti/p/%40154yajce" target="_blank" rel="noopener" class="btn btn-line btn-sm">LINEで無料相談</a>
        <button class="rz3-nav-toggle" aria-label="メニューを開く" aria-expanded="false"><span></span><span></span><span></span></button>
      </nav>
    </div>
    <div class="rz3-mobile-nav">
      <a href="/#service">サービス</a>
      <a href="/#price">料金</a>
      <a href="/#case">導入事例</a>
      <a href="/#company">会社概要</a>
      <a href="/blog-list">ブログ</a>
      <a href="/#contact">お問い合わせ</a>
      <a href="https://line.me/R/ti/p/%40154yajce" target="_blank" rel="noopener" class="btn btn-line" style="margin-top:8px;justify-content:center;">LINEで無料相談</a>
    </div>
  </header>

  <div class="rz3-blog-hero">
    <h1>${activeCategory ? esc(activeCategory) : 'ブログ'}</h1>
    <p>RAIZONの最新情報・お役立ち記事をお届けします</p>
  </div>

  <section style="background:#F5F7FA;padding:56px 40px 100px;">
    <div class="wrap" style="padding:0;">
      ${categoryTabsHtml}
      ${cardsHtml}

      <div style="margin-top:56px;padding:28px 32px;background:#FFFFFF;border-radius:16px;border:1px solid #E5E9F0;text-align:center;">
        <p style="font-size:14px;font-weight:700;color:#146EF5;margin-bottom:16px;">RAIZONのサービス</p>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;">
          <a href="/#service" style="padding:9px 20px;background:#EEF4FE;border:1px solid #D6E4FC;border-radius:999px;font-size:13px;color:#146EF5;font-weight:600;">LINE構築</a>
          <a href="/#service" style="padding:9px 20px;background:#EEF4FE;border:1px solid #D6E4FC;border-radius:999px;font-size:13px;color:#146EF5;font-weight:600;">AI活用支援</a>
          <a href="/#service" style="padding:9px 20px;background:#EEF4FE;border:1px solid #D6E4FC;border-radius:999px;font-size:13px;color:#146EF5;font-weight:600;">DX支援</a>
          <a href="/#case" style="padding:9px 20px;background:#EEF4FE;border:1px solid #D6E4FC;border-radius:999px;font-size:13px;color:#146EF5;font-weight:600;">導入事例</a>
          <a href="/#contact" style="padding:9px 20px;background:#EEF4FE;border:1px solid #D6E4FC;border-radius:999px;font-size:13px;color:#146EF5;font-weight:600;">無料相談</a>
        </div>
      </div>
    </div>
  </section>

  <footer class="rz3-footer">
    <div class="rz3-footer-in">
      <div style="max-width:440px;">
        <img src="/assets-v3/raizon-logo.png" alt="RAIZON" style="height:64px;width:auto;">
        <p style="margin:24px 0 0;font-size:16px;font-weight:700;">沖縄の事業者に、デジタル担当者を。</p>
      </div>
      <nav class="rz3-footer-nav">
        <a href="/#service">サービス</a><a href="/#price">料金</a><a href="/#case">導入事例</a><a href="/#company">会社概要</a><a href="/blog-list">ブログ</a><a href="/#contact">お問い合わせ</a>
      </nav>
    </div>
    <div class="rz3-footer-bottom">© RAIZON</div>
  </footer>

  <div class="rz3-mobile-cta">
    <a href="https://line.me/R/ti/p/%40154yajce" target="_blank" rel="noopener" style="background:#06C755;color:#FFFFFF;">LINEで相談</a>
    <a href="/#contact" style="background:#146EF5;color:#FFFFFF;">無料相談</a>
  </div>

  <script src="/site-v3.js?v=2"></script>
</body>
</html>`;
}
