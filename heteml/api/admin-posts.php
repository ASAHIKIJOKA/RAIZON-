<?php
// 管理API: ブログ記事の作成・更新・削除(パスワード認証必須)
//   POST /api/admin-posts
//   ヘッダー x-admin-password: 管理パスワード(_secrets/admin.json の値と照合)
//   body     { action: 'verify' | 'list' | 'add' | 'import' | 'update' | 'put' | 'delete', id?, post?, posts? }
require dirname(__DIR__) . '/_lib/blog.php';

const RZ_ALLOWED_FIELDS = ['title', 'body', 'category', 'thumbnail', 'createdAt', 'updatedAt'];
const RZ_MAX_IMPORT = 40;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function rz_out($code, $data) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function rz_password_ok($input) {
    $cfg = rz_read_json(rz_root() . '/_secrets/admin.json', []);
    if (empty($cfg['salt']) || empty($cfg['hash']) || empty($cfg['iter']) || !is_string($input) || $input === '') return false;
    $calc = hash_pbkdf2('sha256', $input, $cfg['salt'], (int)$cfg['iter'], 64, false);
    return hash_equals((string)$cfg['hash'], $calc);
}

function rz_pick($post) {
    $out = [];
    if (!is_array($post)) return $out;
    foreach (RZ_ALLOWED_FIELDS as $k) {
        if (array_key_exists($k, $post)) $out[$k] = $post[$k];
    }
    return $out;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') rz_out(405, ['error' => 'Method not allowed']);

$cfgFile = rz_root() . '/_secrets/admin.json';
if (!is_file($cfgFile)) rz_out(500, ['error' => 'server not configured']);

$pw = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
if ($pw === '' && function_exists('getallheaders')) {
    foreach (getallheaders() as $k => $v) {
        if (strtolower($k) === 'x-admin-password') { $pw = $v; break; }
    }
}
if (!rz_password_ok($pw)) {
    sleep(1); // 総当たり対策の遅延
    rz_out(401, ['error' => 'unauthorized']);
}

$body = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($body)) $body = [];
$action = $body['action'] ?? '';
$id = $body['id'] ?? null;
$post = $body['post'] ?? null;

try {
    if ($action === 'verify') rz_out(200, ['ok' => true]);
    if ($action === 'list') rz_out(200, rz_all_posts());

    $now = rz_iso(time());
    $over = rz_overrides();

    if ($action === 'import') {
        $items = $body['posts'] ?? null;
        if (!is_array($items) || count($items) < 1 || count($items) > RZ_MAX_IMPORT) rz_out(400, ['error' => 'posts must be 1-' . RZ_MAX_IMPORT . ' items']);
        $prepared = [];
        $seen = [];
        foreach ($items as $item) {
            $data = rz_pick($item);
            $validDate = !empty($data['createdAt']) && rz_ts($data['createdAt']) > 0;
            if (empty($data['title']) || !is_string($data['title']) || trim($data['title']) === '' || empty($data['body']) || !is_string($data['body']) || trim($data['body']) === '' || !$validDate) {
                rz_out(400, ['error' => 'each post needs title, body and a valid createdAt']);
            }
            $data['updatedAt'] = $now;
            $given = $item['id'] ?? null;
            if ($given !== null && !rz_valid_id($given)) rz_out(400, ['error' => 'invalid id (use letters, numbers, - and _ up to 64 chars)']);
            if ($given !== null) {
                if (isset($seen[$given])) rz_out(400, ['error' => 'duplicate id in import']);
                $seen[$given] = true;
            }
            $prepared[] = [$given, $data];
        }
        $created = [];
        foreach ($prepared as [$given, $data]) {
            $newId = $given ?: rz_new_id();
            $over[$newId] = $data;
            $created[] = ['id' => $newId, 'title' => $data['title'], 'createdAt' => $data['createdAt'], 'published' => rz_is_published($data)];
        }
        rz_save_overrides($over);
        rz_indexnow(null);
        rz_out(200, ['ok' => true, 'created' => $created]);
    }

    if ($action === 'add') {
        $newId = rz_new_id();
        $data = rz_pick($post);
        $data['updatedAt'] = $now;
        if (empty($data['createdAt'])) $data['createdAt'] = $now;
        $over[$newId] = $data;
        rz_save_overrides($over);
        if (rz_is_published($data)) rz_indexnow($newId);
        rz_out(200, $data + ['id' => $newId]);
    }

    if (!rz_valid_id($id)) rz_out(400, ['error' => 'invalid id']);

    if ($action === 'put') {
        $data = rz_pick($post);
        $data['updatedAt'] = (is_array($post) && !empty($post['updatedAt'])) ? $post['updatedAt'] : $now;
        $over[$id] = $data;
        rz_save_overrides($over);
        rz_out(200, $data + ['id' => $id]);
    }

    if ($action === 'update') {
        $current = rz_get_post($id) ?: [];
        unset($current['id']);
        $data = array_merge($current, rz_pick($post), ['updatedAt' => $now]);
        $over[$id] = $data;
        rz_save_overrides($over);
        rz_indexnow($id);
        rz_out(200, rz_pick($post) + ['updatedAt' => $now, 'id' => $id]);
    }

    if ($action === 'delete') {
        $over[$id] = ['_deleted' => true];
        rz_save_overrides($over);
        rz_indexnow(null);
        rz_out(200, ['ok' => true]);
    }

    rz_out(400, ['error' => 'unknown action']);
} catch (Throwable $e) {
    error_log('admin-posts error: ' . $e->getMessage());
    rz_out(500, ['error' => 'server error']);
}
