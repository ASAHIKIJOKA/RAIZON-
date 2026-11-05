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

$tabs = '<div class="bl-tabs" role="navigation" aria-label="カテゴリーで絞り込み">'
    . '<a href="/blog-list" class="' . ($active !== '' ? '' : 'on') . '">すべて</a>';
foreach ($categories as $cat) {
    $tabs .= '<a href="/blog-list?category=' . rawurlencode($cat) . '" class="' . ($active === $cat ? 'on' : '') . '">' . rz_esc($cat) . '</a>';
}
$tabs .= '</div>';

if (!$filtered) {
    $cards = '<p style="text-align:center;color:#6B7280;padding:48px 0;">' . ($active !== '' ? '「' . rz_esc($active) . '」の記事は現在ありません。' : '現在、記事はありません。') . '</p>';
} else {
    $cards = '<div class="bl-cards">';
    foreach ($filtered as $p) {
        $cards .= '
      <a class="bl-card" href="/blog/' . rz_esc($p['id']) . '" itemscope itemtype="https://schema.org/BlogPosting">
        <div class="th"><img src="' . rz_esc(rz_thumb($p)) . '" alt="" loading="lazy" itemprop="image"></div>
        <span class="tag">' . rz_esc(($p['category'] ?? '') ?: 'お知らせ') . '</span>
        <h2 itemprop="headline">' . rz_esc($p['title'] ?? '') . '</h2>
        <time datetime="' . rz_iso(rz_ts($p['createdAt'])) . '" itemprop="datePublished">' . rz_format_date($p['createdAt']) . '</time>
        <meta itemprop="description" content="' . rz_esc(rz_truncate($p['body'] ?? '', 80)) . '">
      </a>';
    }
    $cards .= '</div>';
}

$recent = '';
foreach (array_slice($posts, 0, 5) as $p) {
    $recent .= '
      <a class="bl-rc" href="/blog/' . rz_esc($p['id']) . '"><img src="' . rz_esc(rz_thumb($p)) . '" alt="" loading="lazy"><div><b>' . rz_esc($p['title'] ?? '') . '</b><time>' . rz_format_date($p['createdAt']) . '</time></div></a>';
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
<?= rz_src_script() ?>

</head>
<body>
  <?= rz_tpl('header.html') ?>

  <section class="ph2"><div class="wrap">
    <div class="crumb"><a href="/">トップ</a><i>／</i>ブログ</div>
    <h1>MEDIA</h1><div class="jp"><?= $active !== '' ? rz_esc($active) : 'ブログ｜LINEとデジタル活用のコラム' ?></div>
    <p class="ds">LINE公式アカウント・業務のデジタル化について、沖縄の事業者さま向けに手順やヒントを公開しています。</p>
    <div class="wm" aria-hidden="true">MEDIA</div>
  </div></section>
  <div class="main"><div class="wrap">
    <div class="bl-grid">
      <div>
        <?= $tabs ?>
        <?= $cards ?>
      </div>
      <aside class="bl-side">
        <input class="bl-search" id="bl-q" type="search" placeholder="キーワードで記事を検索" aria-label="記事を検索">
        <div class="bl-sidehd">新着の記事</div>
        <?= $recent ?>
      </aside>
    </div>
  </div></div>

  <?= rz_tpl('footer.html') ?>
<script>
(function(){var q=document.getElementById('bl-q');if(!q)return;q.addEventListener('input',function(){var v=q.value.trim().toLowerCase();document.querySelectorAll('.bl-card').forEach(function(c){c.style.display=(!v||c.textContent.toLowerCase().indexOf(v)>-1)?'':'none';});});})();
</script>
</body>
</html>
