// ========================================
// SSR: ブログ記事ページ
// Googlebot向けにサーバーサイドでHTMLを生成する
// ========================================

const FIREBASE_BASE = 'https://parlor-minato-default-rtdb.firebaseio.com/raizon-blog/posts';
const FIREBASE_SECRET = 'pyx1oEgJdwLh7gg6031seevIZN6be8zWiCHzopEO';

module.exports = async function handler(req, res) {
  const id = req.query.id;

  if (!id) {
    res.redirect(302, '/blog-list');
    return;
  }

  let post = null;
  try {
    const r = await fetch(`${FIREBASE_BASE}/${id}.json?auth=${FIREBASE_SECRET}`);
    post = await r.json();
  } catch (e) {
    console.error('Firebase fetch error:', e);
  }

  if (!post || post.error) {
    res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(notFoundHtml());
    return;
  }

  const postUrl  = `https://raizon-okinawa.com/blog-post?id=${id}`;
  const desc     = truncate(post.body || '', 120);
  const img      = post.thumbnail || 'https://raizon-okinawa.com/seo-meo-thumb.webp';
  const datePub  = new Date(post.createdAt).toISOString();
  const dateMod  = new Date(post.updatedAt || post.createdAt).toISOString();
  const fmtDate  = formatDate(post.createdAt);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.end(renderHtml({ post, postUrl, desc, img, datePub, dateMod, fmtDate, id }));
};

// ----------------------------------------
// ユーティリティ
// ----------------------------------------
function truncate(text, len) {
  const plain = text.replace(/<[^>]*>/g, '');
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
function renderHtml({ post, postUrl, desc, img, datePub, dateMod, fmtDate, id }) {
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
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css">
  <script type="application/ld+json">${ldBlogPosting}</script>
  <script type="application/ld+json">${ldBreadcrumb}</script>
  <style>
    .blog-post-page .navbar{background:rgba(255,255,255,.97);box-shadow:0 1px 3px rgba(0,0,0,.08);backdrop-filter:blur(12px)}
    .blog-post-page .nav-logo-img{filter:none}
    .blog-post-page .nav-menu a{color:#2d3748}
    .blog-post-page .nav-menu a:hover{background:#edf2f7;color:#0e4d6e}
    .blog-post-page .nav-toggle span{background:#2d3748}
    .post-page-body{padding:100px 0 80px;background:#f7fafc;min-height:70vh}
    .post-container{max-width:780px;margin:0 auto;padding:0 24px}
    .post-breadcrumb{display:flex;align-items:center;flex-wrap:nowrap;gap:6px;font-size:.82rem;color:#718096;margin-bottom:32px;overflow:hidden}
    .post-breadcrumb a{color:#1a7baa;text-decoration:none;white-space:nowrap}
    .post-breadcrumb a:hover{text-decoration:underline}
    .post-breadcrumb .bc-sep{opacity:.5;white-space:nowrap;flex-shrink:0}
    .post-breadcrumb .bc-title{opacity:.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
    .post-thumb{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:20px;margin-bottom:32px;box-shadow:0 4px 16px rgba(0,0,0,.1)}
    .post-meta{display:flex;align-items:center;gap:12px;margin-bottom:16px}
    .post-title{font-size:clamp(1.4rem,3.5vw,2rem);font-weight:900;line-height:1.4;color:#2d3748;margin-bottom:32px}
    .post-body-wrap{background:#fff;border-radius:20px;padding:48px;box-shadow:0 1px 3px rgba(0,0,0,.08);border:1px solid #e2e8f0;line-height:1.9;color:#2d3748}
    .post-body-wrap h2{font-size:1.3rem;font-weight:700;color:#0e4d6e;margin:2em 0 .8em;padding-bottom:8px;border-bottom:2px solid #17a2b8}
    .post-body-wrap h2:first-child{margin-top:0}
    .post-body-wrap h3{font-size:1.1rem;font-weight:700;color:#2d3748;margin:1.6em 0 .6em}
    .post-body-wrap p{margin-bottom:1.2em}
    .post-body-wrap ul,.post-body-wrap ol{padding-left:1.5em;margin-bottom:1.2em}
    .post-body-wrap li{margin-bottom:.4em}
    .post-body-wrap strong{color:#0e4d6e}
    .post-body-wrap a{color:#1a7baa;text-decoration:underline}
    .post-back{margin-top:48px;display:flex;gap:12px}
    @media(max-width:600px){.post-body-wrap{padding:28px 20px}.post-title{font-size:1.3rem}.post-back{flex-direction:column;gap:10px}.post-back .btn,.post-back .btn-outline-dark{width:100%;text-align:center;padding:11px 20px;font-size:.88rem}.post-breadcrumb .bc-title,.post-breadcrumb .bc-title-sep{display:none}}
  </style>
</head>
<body class="blog-post-page">
  <nav class="navbar" id="navbar">
    <div class="nav-container">
      <a href="/" class="nav-logo"><img src="/RAIZONロゴ.png" alt="RAIZON - 沖縄のLINE構築・AI活用・DX支援" class="nav-logo-img"></a>
      <button class="nav-toggle" id="navToggle" aria-label="メニュー"><span></span><span></span><span></span></button>
      <ul class="nav-menu" id="navMenu">
        <li><a href="/#service-ai">サービス</a></li>
        <li><a href="/#cases">導入事例</a></li>
        <li><a href="/blog-list">ブログ</a></li>
        <li><a href="/#faq">FAQ</a></li>
        <li><a href="/#contact" class="nav-cta">無料相談</a></li>
        <li><a href="https://lin.ee/fD0d4TS" target="_blank" rel="noopener" class="nav-line">公式LINE</a></li>
      </ul>
    </div>
  </nav>

  <div class="post-page-body">
    <div class="post-container">
      <nav class="post-breadcrumb" aria-label="パンくずリスト">
        <a href="/">ホーム</a>
        <span class="bc-sep">/</span>
        <a href="/blog-list">ブログ</a>
        <span class="bc-sep bc-title-sep">/</span>
        <span class="bc-title">${esc(post.title)}</span>
      </nav>

      ${post.thumbnail ? `<img class="post-thumb" src="${esc(post.thumbnail)}" alt="${esc(post.title)}" loading="lazy">` : ''}

      <div class="post-meta">
        <span class="blog-card-cat">${esc(post.category || 'お知らせ')}</span>
        <time datetime="${datePub}" style="font-size:.85rem;color:#718096;">${fmtDate}</time>
      </div>

      <h1 class="post-title">${esc(post.title)}</h1>

      <div class="post-body-wrap">${post.body}</div>

      <div class="post-back">
        <a href="/blog-list" class="btn btn-primary">← ブログ一覧に戻る</a>
        <a href="/" class="btn-outline-dark" style="display:inline-flex;align-items:center;padding:12px 24px;border:2px solid #2d3748;border-radius:8px;text-decoration:none;font-weight:600;color:#2d3748;">トップページへ</a>
      </div>
    </div>
  </div>

  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-brand">
          <img src="/RAIZONロゴ.png" alt="RAIZON - 沖縄のLINE構築・AI活用・DX支援" class="footer-logo-img">
          <p>デジタルで変える。<br>働き方も、仕組みも、売り方も。</p>
        </div>
        <div class="footer-info">
          <p>沖縄県 | LINE・メール：24時間受付（年中無休）</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 RAIZON. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <script>
    const nt = document.getElementById('navToggle');
    const nm = document.getElementById('navMenu');
    nt.addEventListener('click', () => nm.classList.toggle('active'));
    nm.querySelectorAll('a').forEach(l => l.addEventListener('click', () => nm.classList.remove('active')));
    window.addEventListener('scroll', () => {
      document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
    });
  </script>
</body>
</html>`;
}

function notFoundHtml() {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>記事が見つかりません | RAIZON</title><meta name="robots" content="noindex"><link rel="stylesheet" href="/style.css"></head><body style="padding:120px 24px;text-align:center;font-family:sans-serif"><h1 style="font-size:1.4rem;margin-bottom:16px">記事が見つかりません</h1><p style="color:#718096;margin-bottom:32px">削除されたか、URLが正しくない可能性があります。</p><a href="/blog-list" style="background:#0e4d6e;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">ブログ一覧に戻る</a></body></html>`;
}
