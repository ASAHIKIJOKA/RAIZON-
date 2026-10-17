<?php
// ブログ記事ページ(サーバー側でHTMLを作る。検索エンジン向け)
require __DIR__ . '/_lib/blog.php';

function rz_not_found($code) {
    http_response_code($code);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>記事が見つかりません | RAIZON</title><meta name="robots" content="noindex"><link rel="stylesheet" href="/site-v3.css?v=2"></head><body class="rz3" style="padding:120px 24px;text-align:center;"><h1 style="font-size:1.4rem;margin-bottom:16px;">記事が見つかりません</h1><p style="color:#6B7280;margin-bottom:32px;">削除されたか、URLが正しくない可能性があります。</p><a href="/blog-list" class="btn btn-primary">ブログ一覧に戻る</a></body></html>';
    exit;
}

$id = isset($_GET['id']) ? $_GET['id'] : '';
if (!rz_valid_id($id)) {
    header('Location: /blog-list', true, 302);
    exit;
}

$post = rz_get_post($id);
if (!$post || !rz_is_published($post)) {
    // 取り下げた記事は410(完全に削除済み)にして、検索エンジンの索引から早く外す
    rz_not_found(in_array($id, rz_hidden_ids(), true) ? 410 : 404);
}

$related = [];
foreach (rz_published_posts() as $p) {
    if ($p['id'] !== $id && !empty($p['createdAt'])) $related[] = $p;
    if (count($related) >= 3) break;
}

$postUrl = 'https://raizon-okinawa.com/blog/' . $id;
$body = $post['body'] ?? '';
$desc = rz_truncate($body, 120);
$thumb = $post['thumbnail'] ?? '';
$img = ($thumb && preg_match('#^https?://#', $thumb)) ? $thumb : 'https://raizon-okinawa.com/ogp-logo.png';
$datePub = rz_iso(rz_ts($post['createdAt']));
$dateMod = rz_iso(rz_ts($post['updatedAt'] ?? $post['createdAt']));
$fmtDate = rz_format_date($post['createdAt']);
$title = $post['title'] ?? '';
$category = ($post['category'] ?? '') ?: 'お知らせ';

$ldPost = rz_json([
    '@context' => 'https://schema.org',
    '@type' => 'BlogPosting',
    'headline' => $title,
    'description' => $desc,
    'image' => $img,
    'datePublished' => $datePub,
    'dateModified' => $dateMod,
    'author' => ['@type' => 'Organization', 'name' => 'RAIZON', 'url' => 'https://raizon-okinawa.com'],
    'publisher' => [
        '@type' => 'Organization',
        'name' => 'RAIZON',
        'logo' => ['@type' => 'ImageObject', 'url' => 'https://raizon-okinawa.com/apple-touch-icon.png'],
    ],
    'mainEntityOfPage' => ['@type' => 'WebPage', '@id' => $postUrl],
    'url' => $postUrl,
]);
$ldFaq = rz_faq_jsonld($body);
$ldCrumb = rz_json([
    '@context' => 'https://schema.org',
    '@type' => 'BreadcrumbList',
    'itemListElement' => [
        ['@type' => 'ListItem', 'position' => 1, 'name' => 'ホーム', 'item' => 'https://raizon-okinawa.com/'],
        ['@type' => 'ListItem', 'position' => 2, 'name' => 'ブログ', 'item' => 'https://raizon-okinawa.com/blog-list'],
        ['@type' => 'ListItem', 'position' => 3, 'name' => $title, 'item' => $postUrl],
    ],
]);

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=300');
?>
<!DOCTYPE html>
<html lang="ja">
<head>
  <?= rz_head_common() ?>

  <title><?= rz_esc($title) ?> | RAIZON</title>
  <meta name="description" content="<?= rz_esc($desc) ?>">
  <meta property="og:title" content="<?= rz_esc($title) ?> | RAIZON">
  <meta property="og:description" content="<?= rz_esc($desc) ?>">
  <meta property="og:type" content="article">
  <meta property="og:url" content="<?= $postUrl ?>">
  <meta property="og:image" content="<?= rz_esc($img) ?>">
  <meta property="og:locale" content="ja_JP">
  <meta property="og:site_name" content="RAIZON">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="<?= rz_esc($title) ?> | RAIZON">
  <meta name="twitter:description" content="<?= rz_esc($desc) ?>">
  <meta name="twitter:image" content="<?= rz_esc($img) ?>">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="<?= $postUrl ?>">
  <?= rz_head_assets() ?>

  <script type="application/ld+json"><?= $ldPost ?></script>
  <script type="application/ld+json"><?= $ldCrumb ?></script>
  <?= $ldFaq !== '' ? '<script type="application/ld+json">' . $ldFaq . '</script>' : '' ?>

  <?= rz_tpl('post-style.html') ?>

<?= rz_src_script() ?>

</head>
<body class="rz3">
  <?= rz_tpl('header.html') ?>


  <div class="post-page-body">
    <div class="post-container">
      <nav class="post-breadcrumb" aria-label="パンくずリスト">
        <a href="/">ホーム</a>
        <span class="bc-sep">/</span>
        <a href="/blog-list">ブログ</a>
        <span class="bc-sep bc-title-sep">/</span>
        <span class="bc-title"><?= rz_esc($title) ?></span>
      </nav>

      <img class="post-thumb" src="<?= rz_esc(rz_thumb($post)) ?>" alt="<?= rz_esc($title) ?>" loading="lazy">

      <div class="post-meta">
        <span class="rz3-blog-cat"><?= rz_esc($category) ?></span>
        <time datetime="<?= $datePub ?>" style="font-size:13px;color:#6B7280;"><?= $fmtDate ?></time>
      </div>

      <h1 class="post-title"><?= rz_esc($title) ?></h1>

      <div class="post-body-wrap"><?= rz_with_toc($body) ?></div>

<?php if ($related): ?>
      <div class="related-posts">
        <h2 class="related-posts-title">最新記事</h2>
        <div class="related-posts-grid">
<?php foreach ($related as $p): ?>
          <a href="/blog/<?= rz_esc($p['id']) ?>" class="rz3-blog-card">
            <div class="related-post-thumb">
              <img src="<?= rz_esc(rz_thumb($p)) ?>" alt="" loading="lazy">
            </div>
            <div class="related-post-body">
              <p class="related-post-date"><?= rz_format_date($p['createdAt']) ?></p>
              <p class="related-post-title"><?= rz_esc($p['title'] ?? '') ?></p>
            </div>
          </a>
<?php endforeach; ?>
        </div>
      </div>
<?php endif; ?>

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

  <?= rz_tpl('footer.html') ?>

</body>
</html>
