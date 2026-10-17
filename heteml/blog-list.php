<?php
// ブログ一覧ページ(サーバー側でHTMLを作る。検索エンジン向け)
require __DIR__ . '/_lib/blog.php';

$posts = rz_published_posts();
$categories = [];
foreach ($posts as $p) {
    $c = $p['category'] ?? '' ?: 'お知らせ';
    if (!in_array($c, $categories, true)) $categories[] = $c;
}
$active = isset($_GET['category']) && is_string($_GET['category']) ? $_GET['category'] : '';
$filtered = $active === '' ? $posts : array_values(array_filter($posts, function ($p) use ($active) {
    return (($p['category'] ?? '') ?: 'お知らせ') === $active;
}));

$pageTitle = $active !== '' ? $active . 'の記事一覧 | RAIZON' : 'ブログ一覧 | RAIZON｜沖縄のDX・LINE・AI活用情報';
$pageDesc = $active !== ''
    ? 'RAIZONの「' . $active . '」カテゴリーの記事一覧。沖縄のDX支援・LINE構築・AI活用に関する最新情報・事例・ノウハウをお届けします。'
    : 'RAIZONのブログ一覧。沖縄のDX支援・LINE構築・AI活用に関する最新情報・事例・ノウハウをお届けします。';
$canonical = $active !== ''
    ? 'https://raizon-okinawa.com/blog-list?category=' . rawurlencode($active)
    : 'https://raizon-okinawa.com/blog-list';

$crumbs = [
    ['@type' => 'ListItem', 'position' => 1, 'name' => 'ホーム', 'item' => 'https://raizon-okinawa.com/'],
    ['@type' => 'ListItem', 'position' => 2, 'name' => 'ブログ一覧', 'item' => 'https://raizon-okinawa.com/blog-list'],
];
if ($active !== '') $crumbs[] = ['@type' => 'ListItem', 'position' => 3, 'name' => $active, 'item' => $canonical];
$ldBreadcrumb = rz_json(['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => $crumbs]);

$tabs = '<div class="rz3-blog-cat-tabs" role="navigation" aria-label="カテゴリーで絞り込み">'
    . '<a href="/blog-list" class="rz3-blog-cat-btn' . ($active !== '' ? '' : ' on') . '">すべて</a>';
foreach ($categories as $cat) {
    $tabs .= '<a href="/blog-list?category=' . rawurlencode($cat) . '" class="rz3-blog-cat-btn' . ($active === $cat ? ' on' : '') . '">' . rz_esc($cat) . '</a>';
}
$tabs .= '</div>';

if (!$filtered) {
    $cards = '<p style="text-align:center;color:#6B7280;padding:48px 0;">' . ($active !== '' ? '「' . rz_esc($active) . '」の記事は現在ありません。' : '現在、記事はありません。') . '</p>';
} else {
    $cards = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:24px;">';
    foreach ($filtered as $p) {
        $cards .= '
      <a class="rz3-blog-card" href="/blog/' . rz_esc($p['id']) . '" itemscope itemtype="https://schema.org/BlogPosting">
        <div class="rz3-blog-thumb"><img src="' . rz_esc(rz_thumb($p)) . '" alt="" loading="lazy" itemprop="image"></div>
        <div class="rz3-blog-body">
          <div class="rz3-blog-meta"><span class="rz3-blog-cat">' . rz_esc(($p['category'] ?? '') ?: 'お知らせ') . '</span><time class="rz3-blog-date" datetime="' . rz_iso(rz_ts($p['createdAt'])) . '" itemprop="datePublished">' . rz_format_date($p['createdAt']) . '</time></div>
          <h2 style="margin:0;font-size:17px;font-weight:700;line-height:1.7;" itemprop="headline">' . rz_esc($p['title'] ?? '') . '</h2>
          <p style="margin:0;font-size:13px;line-height:1.9;color:#6B7280;" itemprop="description">' . rz_esc(rz_truncate($p['body'] ?? '', 80)) . '</p>
        </div>
      </a>';
    }
    $cards .= '</div>';
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=300');
?>
<!DOCTYPE html>
<html lang="ja">
<head>
  <?= rz_head_common() ?>

  <title><?= rz_esc($pageTitle) ?></title>
  <meta name="description" content="<?= rz_esc($pageDesc) ?>">
  <meta property="og:title" content="<?= rz_esc($pageTitle) ?>">
  <meta property="og:description" content="<?= rz_esc($pageDesc) ?>">
  <meta property="og:type" content="website">
  <meta property="og:url" content="<?= $canonical ?>">
  <meta property="og:image" content="https://raizon-okinawa.com/ogp-logo.png">
  <meta property="og:locale" content="ja_JP">
  <meta property="og:site_name" content="RAIZON">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="<?= rz_esc($pageTitle) ?>">
  <meta name="twitter:description" content="<?= rz_esc($pageDesc) ?>">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="<?= $canonical ?>">
  <?= rz_head_assets() ?>

  <script type="application/ld+json"><?= $ldBreadcrumb ?></script>
  <style>
    .rz3-blog-hero{background:linear-gradient(160deg,#146EF5 0%,#0B2E6B 100%);padding:64px 40px;text-align:center;color:#fff;}
    .rz3-blog-hero h1{font-size:clamp(1.6rem,3.5vw,2.2rem);font-weight:800;margin-bottom:10px;}
    .rz3-blog-hero p{font-size:1rem;opacity:.85;}
    .rz3-blog-cat-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:32px;}
  </style>
<?= rz_src_script() ?>

</head>
<body class="rz3">
  <?= rz_tpl('header.html') ?>


  <div class="rz3-blog-hero">
    <h1><?= $active !== '' ? rz_esc($active) : 'ブログ' ?></h1>
    <p>RAIZONの最新情報・お役立ち記事をお届けします</p>
  </div>

  <section style="background:#F5F7FA;padding:56px 40px 100px;">
    <div class="wrap" style="padding:0;">
      <?= $tabs ?>

      <?= $cards ?>


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

  <?= rz_tpl('footer.html') ?>

</body>
</html>
