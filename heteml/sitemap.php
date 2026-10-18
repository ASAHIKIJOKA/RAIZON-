<?php
require __DIR__ . '/_lib/blog.php';

$posts = rz_published_posts();
$latest = '';
foreach ($posts as $p) {
    $d = substr((string)($p['updatedAt'] ?? $p['createdAt'] ?? ''), 0, 10);
    if ($d > $latest) $latest = $d;
}
$base = 'https://raizon-okinawa.com';
$urls = [
    ['loc' => $base . '/'],
    ['loc' => $base . '/line'],
    ['loc' => $base . '/system'],
    ['loc' => $base . '/consult'],
    ['loc' => $base . '/blog-list', 'lastmod' => $latest],
];
foreach ($posts as $p) {
    $urls[] = ['loc' => $base . '/blog/' . $p['id'], 'lastmod' => substr((string)($p['updatedAt'] ?? $p['createdAt'] ?? ''), 0, 10)];
}

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=3600');
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
foreach ($urls as $u) {
    echo "  <url>\n    <loc>" . htmlspecialchars($u['loc'], ENT_XML1) . "</loc>\n";
    if (!empty($u['lastmod'])) echo '    <lastmod>' . $u['lastmod'] . "</lastmod>\n";
    echo "  </url>\n";
}
echo '</urlset>';
