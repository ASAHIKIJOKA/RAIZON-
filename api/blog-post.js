// ========================================
// SSR: ブログ記事ページ
// Googlebot向けにサーバーサイドでHTMLを生成する
// ========================================

const { isValidId, isPublished, hiddenIds, getPublishedPosts, getPost } = require('./_firebase');

module.exports = async function handler(req, res) {
  const id = req.query.id;

  if (!id || !isValidId(id)) {
    res.redirect(302, '/blog-list');
    return;
  }

  let post = null;
  let relatedPosts = [];
  try {
    const [singlePost, allPosts] = await Promise.all([getPost(id), getPublishedPosts()]);
    post = singlePost;
    relatedPosts = allPosts
      .filter(p => p.id !== id && p.createdAt)
      .slice(0, 3);
  } catch (e) {
    console.error('Firebase fetch error:', e);
  }

  if (!post || post.error || !isPublished(post)) {
    // 意図的に取り下げた記事は410(完全に削除済み)を返し、検索エンジンの索引から早く外れるようにする
    res.status(hiddenIds().has(id) ? 410 : 404).setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(notFoundHtml());
    return;
  }

  const postUrl  = `https://raizon-okinawa.com/blog/${id}`;
  const desc     = truncate(post.body || '', 120);
  // data: URI のサムネイルは SNS・検索エンジンで使えないため、共有用の画像は既定画像にする
  const img      = (post.thumbnail && /^https?:\/\//.test(post.thumbnail)) ? post.thumbnail : 'https://raizon-okinawa.com/ogp-logo.png';
  const datePub  = new Date(post.createdAt).toISOString();
  const dateMod  = new Date(post.updatedAt || post.createdAt).toISOString();
  const fmtDate  = formatDate(post.createdAt);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.end(renderHtml({ post, postUrl, desc, img, datePub, dateMod, fmtDate, id, relatedPosts }));
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

// 本文の「よくある質問」(h2)の後ろにある h3(質問) と p(回答) を FAQPage の構造化データにする
function buildFaqJsonLd(body) {
  const start = body.indexOf('<h2>よくある質問</h2>');
  if (start < 0) return '';
  let section = body.slice(start + '<h2>よくある質問</h2>'.length);
  const nextH2 = section.search(/<h2[\s>]/);
  if (nextH2 >= 0) section = section.slice(0, nextH2);
  const strip = t => t.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const items = [];
  const re = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = re.exec(section))) {
    const q = strip(m[1]), a = strip(m[2]);
    if (q && a) items.push({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } });
  }
  return items.length ? JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items }) : '';
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
function renderHtml({ post, postUrl, desc, img, datePub, dateMod, fmtDate, id, relatedPosts }) {
  const ldBlogPosting = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: desc,
    image: img,
    datePublished: datePub,
    dateModified: dateMod,
    author: { '@type': 'Organization', name: 'RAIZON', url: 'https://raizon-okinawa.com' },
    publisher: {
      '@type': 'Organization',
      name: 'RAIZON',
      logo: { '@type': 'ImageObject', url: 'https://raizon-okinawa.com/apple-touch-icon.png' }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    url: postUrl
  });

  const ldFaq = buildFaqJsonLd(post.body || '');

  const ldBreadcrumb = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://raizon-okinawa.com/' },
      { '@type': 'ListItem', position: 2, name: 'ブログ', item: 'https://raizon-okinawa.com/blog-list' },
      { '@type': 'ListItem', position: 3, name: post.title, item: postUrl }
    ]
  });

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
  <title>${esc(post.title)} | RAIZON</title>
  <meta name="description" content="${esc(desc)}">
  <meta property="og:title" content="${esc(post.title)} | RAIZON">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${postUrl}">
  <meta property="og:image" content="${esc(img)}">
  <meta property="og:locale" content="ja_JP">
  <meta property="og:site_name" content="RAIZON">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(post.title)} | RAIZON">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${esc(img)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${postUrl}">
  <link rel="icon" type="image/png" href="/favicon-32.png" sizes="32x32">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/site-v3.css?v=2">
  <script type="application/ld+json">${ldBlogPosting}</script>
  <script type="application/ld+json">${ldBreadcrumb}</script>
  ${ldFaq ? `<script type="application/ld+json">${ldFaq.replace(/</g, '\\u003c')}</script>` : ''}
  <style>
    .post-page-body{padding:64px 40px 80px;background:#F5F7FA;min-height:70vh;}
    .post-container{max-width:780px;margin:0 auto;}
    .post-breadcrumb{display:flex;align-items:center;flex-wrap:nowrap;gap:6px;font-size:13px;color:#6B7280;margin-bottom:28px;overflow:hidden;}
    .post-breadcrumb a{color:#146EF5;text-decoration:none;white-space:nowrap;}
    .post-breadcrumb a:hover{text-decoration:underline;}
    .post-breadcrumb .bc-sep{opacity:.5;white-space:nowrap;flex-shrink:0;}
    .post-breadcrumb .bc-title{opacity:.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}
    .post-thumb{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:20px;margin-bottom:28px;}
    .post-meta{display:flex;align-items:center;gap:12px;margin-bottom:14px;}
    .post-title{font-size:clamp(1.4rem,3.5vw,2rem);font-weight:800;line-height:1.5;color:#111827;margin-bottom:28px;}
    .post-body-wrap{background:#FFFFFF;border-radius:20px;padding:48px;border:1px solid #E5E9F0;line-height:1.9;color:#111827;}
    .post-body-wrap h2{font-size:1.25rem;font-weight:800;color:#146EF5;margin:2em 0 .8em;padding-bottom:8px;border-bottom:2px solid #EEF4FE;}
    .post-body-wrap h2:first-child{margin-top:0;}
    .post-body-wrap h3{font-size:1.05rem;font-weight:700;color:#111827;margin:1.6em 0 .6em;}
    .post-body-wrap p{margin-bottom:1.2em;}
    .post-body-wrap ul,.post-body-wrap ol{padding-left:1.5em;margin-bottom:1.2em;}
    .post-body-wrap li{margin-bottom:.4em;}
    .post-body-wrap strong{color:#146EF5;}
    .post-body-wrap a{color:#146EF5;text-decoration:underline;}
    .post-back{margin-top:40px;display:flex;gap:12px;}
    .related-posts{margin-top:56px;}
    .related-posts-title{font-size:17px;font-weight:800;color:#111827;margin-bottom:18px;padding-bottom:8px;border-bottom:2px solid #E5E9F0;}
    .related-posts-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
    .related-post-thumb{aspect-ratio:16/9;overflow:hidden;background:#EEF4FE;}
    .related-post-thumb img{width:100%;height:100%;object-fit:cover;display:block;}
    .related-post-body{padding:10px 2px;}
    .related-post-date{font-size:12px;color:#6B7280;margin-bottom:4px;font-family:Inter;}
    .related-post-title{font-size:13px;font-weight:700;color:#111827;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
    .post-service-cta{margin-top:40px;padding:22px 24px;background:#EEF4FE;border-radius:16px;border:1px solid #D6E4FC;}
    .post-service-cta-label{font-size:14px;color:#146EF5;font-weight:700;margin-bottom:12px;}
    .post-service-cta-links{display:flex;flex-wrap:wrap;gap:10px;}
    .post-service-cta-links a{padding:8px 18px;background:#FFFFFF;border:1px solid #D6E4FC;border-radius:999px;font-size:13px;color:#146EF5;font-weight:600;}
    @media(max-width:600px){.post-body-wrap{padding:28px 20px;}.post-title{font-size:1.3rem;}.post-back{flex-direction:column;gap:10px;}.post-breadcrumb .bc-title{display:none;}.related-posts-grid{grid-template-columns:1fr;}}
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
        <a href="https://lin.ee/fD0d4TS" target="_blank" rel="noopener" class="btn btn-line btn-sm">LINEで無料相談</a>
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
      <a href="https://lin.ee/fD0d4TS" target="_blank" rel="noopener" class="btn btn-line" style="margin-top:8px;justify-content:center;">LINEで無料相談</a>
    </div>
  </header>

  <div class="post-page-body">
    <div class="post-container">
      <nav class="post-breadcrumb" aria-label="パンくずリスト">
        <a href="/">ホーム</a>
        <span class="bc-sep">/</span>
        <a href="/blog-list">ブログ</a>
        <span class="bc-sep bc-title-sep">/</span>
        <span class="bc-title">${esc(post.title)}</span>
      </nav>

      <img class="post-thumb" src="${esc(thumbOf(post))}" alt="${esc(post.title)}" loading="lazy">

      <div class="post-meta">
        <span class="rz3-blog-cat">${esc(post.category || 'お知らせ')}</span>
        <time datetime="${datePub}" style="font-size:13px;color:#6B7280;">${fmtDate}</time>
      </div>

      <h1 class="post-title">${esc(post.title)}</h1>

      <div class="post-body-wrap">${post.body}</div>

      ${relatedPosts.length > 0 ? `
      <div class="related-posts">
        <h2 class="related-posts-title">最新記事</h2>
        <div class="related-posts-grid">
          ${relatedPosts.map(p => `
          <a href="/blog/${esc(p.id)}" class="rz3-blog-card">
            <div class="related-post-thumb">
              <img src="${esc(thumbOf(p))}" alt="" loading="lazy">
            </div>
            <div class="related-post-body">
              <p class="related-post-date">${formatDate(p.createdAt)}</p>
              <p class="related-post-title">${esc(p.title)}</p>
            </div>
          </a>`).join('')}
        </div>
      </div>` : ''}

      <div class="post-service-cta">
        <p class="post-service-cta-label">RAIZONのサービスを見る</p>
        <div class="post-service-cta-links">
          <a href="/#service">LINE構築</a>
          <a href="/#service">AI活用支援</a>
          <a href="/#service">DX支援</a>
          <a href="/#contact">無料相談</a>
        </div>
      </div>

      <div class="post-back">
        <a href="/blog-list" class="btn btn-primary">← ブログ一覧に戻る</a>
        <a href="/" style="display:inline-flex;align-items:center;padding:14px 24px;border:1.5px solid #111827;border-radius:999px;text-decoration:none;font-weight:700;font-size:15px;color:#111827;">トップページへ</a>
      </div>
    </div>
  </div>

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
    <a href="https://lin.ee/fD0d4TS" target="_blank" rel="noopener" style="background:#06C755;color:#FFFFFF;">LINEで相談</a>
    <a href="/#contact" style="background:#146EF5;color:#FFFFFF;">無料相談</a>
  </div>

  <script src="/site-v3.js?v=2"></script>
</body>
</html>`;
}

function notFoundHtml() {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>記事が見つかりません | RAIZON</title><meta name="robots" content="noindex"><link rel="stylesheet" href="/site-v3.css?v=2"></head><body class="rz3" style="padding:120px 24px;text-align:center;"><h1 style="font-size:1.4rem;margin-bottom:16px;">記事が見つかりません</h1><p style="color:#6B7280;margin-bottom:32px;">削除されたか、URLが正しくない可能性があります。</p><a href="/blog-list" class="btn btn-primary">ブログ一覧に戻る</a></body></html>`;
}
