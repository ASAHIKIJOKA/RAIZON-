<?php
// 公開API: ブログ記事の取得(読み取り専用)
//   GET /api/posts          → 記事一覧
//   GET /api/posts?id=xxx   → 記事1件
require dirname(__DIR__) . '/_lib/blog.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=60');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if (isset($_GET['id'])) {
    $id = $_GET['id'];
    if (!rz_valid_id($id)) { http_response_code(400); echo json_encode(['error' => 'invalid id']); exit; }
    $post = rz_get_post($id);
    if (!$post || !rz_is_published($post)) { http_response_code(404); echo json_encode(['error' => 'not found']); exit; }
    echo json_encode($post, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

echo json_encode(rz_published_posts(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
