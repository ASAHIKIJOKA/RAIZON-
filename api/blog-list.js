// ========================================
// SSR: ブログ一覧ページ
// Googlebot向けにサーバーサイドでHTMLを生成する
// ========================================

const FIREBASE_URL = 'https://parlor-minato-default-rtdb.firebaseio.com/raizon-blog/posts.json';
const FIREBASE_SECRET = 'pyx1oEgJdwLh7gg6031seevIZN6be8zWiCHzopEO';

module.exports = async function handler(req, res) {
  let posts = [];
  try {
    const r = await fetch(`${FIREBASE_URL}?auth=${FIREBASE_SECRET}`);
    const data = await r.json();
    if (data && !data.error) {
      posts = Object.entries(data)
        .map(([id, post]) => ({ ...post, id }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  } catch (e) {
    console.error('Firebase fetch error:', e);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.end(renderHtml(posts));
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
function renderHtml(posts) {
  const ldBreadcrumb = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://raizon-okinawa.com/' },
      { '@type': 'ListItem', position: 2, name: 'ブログ一覧', item: 'https://raizon-okinawa.com/blog-list' }
    ]
  });

  const noImgSvg = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" fill="%23e2e8f0"><rect width="400" height="225"/><text x="200" y="118" text-anchor="middle" fill="%23a0aec0" font-size="16">No Image</text></svg>')}`;

  const cardsHtml = posts.length === 0
    ? '<p style="text-align:center;color:#718096;padding:48px 0;">現在、記事はありません。</p>'
    : posts.map(post => `
      <article class="blog-card" itemscope itemtype="https://schema.org/BlogPosting">
        <a href="/blog-post?id=${esc(post.id)}" style="text-decoration:none;color:inherit;display:block;">
          <div class="blog-card-thumb">
            <img src="${esc(post.thumbnail || noImgSvg)}" alt="${esc(post.title)}" loading="lazy" itemprop="image">
            <span class="blog-card-cat">${esc(post.category || 'お知らせ')}</span>
          </div>
          <div class="blog-card-body">
            <time class="blog-card-date" datetime="${new Date(post.createdAt).toISOString()}" itemprop="datePublished">${formatDate(post.createdAt)}</time>
            <h2 class="blog-card-title" itemprop="headline">${esc(post.title)}</h2>
            <p class="blog-card-excerpt" itemprop="description">${esc(truncate(post.body || '', 80))}</p>
          </div>
        </a>
      </article>`).join('');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ブログ一覧 | RAIZON｜沖縄のDX・LINE・AI活用情報</title>
  <meta name="description" content="RAIZONのブログ一覧。沖縄のDX支援・LINE構築・AI活用に関する最新情報・事例・ノウハウをお届けします。">
  <meta property="og:title" content="ブログ一覧 | RAIZON｜沖縄のDX・LINE・AI活用情報">
  <meta property="og:description" content="沖縄のDX支援・LINE構築・AI活用に関する最新情報をお届けするRAIZONのブログ。">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://raizon-okinawa.com/blog-list">
  <meta property="og:image" content="https://raizon-okinawa.com/seo-meo-thumb.webp">
  <meta property="og:locale" content="ja_JP">
  <meta property="og:site_name" content="RAIZON">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="ブログ一覧 | RAIZON">
  <meta name="twitter:description" content="沖縄のDX支援・LINE構築・AI活用に関する最新情報をお届けするRAIZONのブログ。">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://raizon-okinawa.com/blog-list">
  <link rel="icon" type="image/png" href="/favicon-32.png" sizes="32x32">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css">
  <script type="application/ld+json">${ldBreadcrumb}</script>
  <style>
    .blog-list-page .navbar{background:rgba(255,255,255,.97);box-shadow:0 1px 3px rgba(0,0,0,.08);backdrop-filter:blur(12px)}
    .blog-list-page .nav-logo-img{filter:none}
    .blog-list-page .nav-menu a{color:#2d3748}
    .blog-list-page .nav-menu a:hover{background:#edf2f7;color:#0e4d6e}
    .blog-list-page .nav-toggle span{background:#2d3748}
    .blog-list-hero{background:linear-gradient(160deg,#0a3d5c 0%,#0e6b8e 50%,#17a2b8 100%);padding:140px 0 60px;text-align:center;color:#fff}
    .blog-list-hero h1{font-size:clamp(1.6rem,3.5vw,2.2rem);font-weight:900;margin-bottom:12px}
    .blog-list-hero p{font-size:1rem;opacity:.85}
    .blog-list-body{padding:60px 0 100px;background:#f7fafc}
    .blog-list-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:40px}
    .blog-card a:hover .blog-card-thumb img{transform:scale(1.05)}
    .blog-list-service-cta{margin-top:56px;padding:28px 32px;background:#fff;border-radius:16px;border:1px solid #e2e8f0;text-align:center}
    .blog-list-service-cta-title{font-size:.9rem;font-weight:700;color:#0e4d6e;margin-bottom:16px}
    .blog-list-service-links{display:flex;flex-wrap:wrap;justify-content:center;gap:12px}
    .blog-list-service-links a{padding:9px 20px;background:#f0f9ff;border:1px solid #bee3f8;border-radius:20px;font-size:.88rem;color:#2b6cb0;text-decoration:none;font-weight:500;transition:background .2s}
    .blog-list-service-links a:hover{background:#ebf8ff}
    @media(max-width:900px){.blog-list-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:580px){.blog-list-grid{grid-template-columns:1fr}.blog-list-service-links{gap:8px}}
  </style>
</head>
<body class="blog-list-page">
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

  <div class="blog-list-hero">
    <div class="container">
      <h1>ブログ</h1>
      <p>RAIZONの最新情報・お役立ち記事をお届けします</p>
    </div>
  </div>

  <div class="blog-list-body">
    <div class="container">
      <div class="blog-list-grid" id="blogListGrid">
        ${cardsHtml}
      </div>

      <div class="blog-list-service-cta">
        <p class="blog-list-service-cta-title">RAIZONのサービス</p>
        <div class="blog-list-service-links">
          <a href="/#service-line">LINE構築</a>
          <a href="/#service-ai">AI活用支援</a>
          <a href="/#service-dx">DX支援</a>
          <a href="/#cases">導入事例</a>
          <a href="/#contact">無料相談（無料）</a>
        </div>
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
