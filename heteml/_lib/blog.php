<?php
// ブログの共通処理(記事の読み書き・表示用の部品)。
// 記事の元データ: _seed/posts.json (ファイル管理の記事。サイトと一緒にアップロードされる)
// 管理画面で作った記事・編集: _data/posts.json (サーバー上にだけ存在。アップロードで上書きされない)

const RZ_HOST = 'raizon-okinawa.com';
const RZ_INDEXNOW_KEY = 'e05e507884b16deb8e3fa6c6771abddc';

function rz_root() { return dirname(__DIR__); }

function rz_valid_id($id) {
    return is_string($id) && preg_match('/^[A-Za-z0-9_-]{1,64}$/', $id) === 1;
}

function rz_read_json($path, $default) {
    if (!is_file($path)) return $default;
    $j = json_decode((string)file_get_contents($path), true);
    return is_array($j) ? $j : $default;
}

function rz_data_dir() {
    $d = rz_root() . '/_data';
    if (!is_dir($d)) @mkdir($d, 0755, true);
    $h = $d . '/.htaccess';
    if (!is_file($h)) {
        @file_put_contents($h, "Require all denied\n<IfModule !mod_authz_core.c>\nOrder deny,allow\nDeny from all\n</IfModule>\n");
    }
    return $d;
}

function rz_hidden_ids() {
    return rz_read_json(rz_root() . '/_seed/hidden-ids.json', []);
}

// 管理画面での変更(id => 記事。削除は ['_deleted' => true])
function rz_overrides() {
    return rz_read_json(rz_data_dir() . '/posts.json', []);
}

function rz_save_overrides($map) {
    $path = rz_data_dir() . '/posts.json';
    $fp = fopen($path, 'c+');
    if (!$fp) throw new Exception('cannot open posts.json');
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($map, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

function rz_ts($iso) {
    $t = strtotime((string)$iso);
    return $t === false ? 0 : $t;
}

// 全記事(予約中を含む)。新しい順。
function rz_all_posts() {
    $seed = rz_read_json(rz_root() . '/_seed/posts.json', []);
    $over = rz_overrides();
    $hidden = array_flip(rz_hidden_ids());
    $byId = [];
    foreach ($seed as $p) {
        if (isset($p['id'])) $byId[$p['id']] = $p;
    }
    foreach ($over as $id => $p) {
        if (!is_array($p)) continue;
        if (!empty($p['_deleted'])) { unset($byId[$id]); continue; }
        if (isset($hidden[$id]) && !isset($byId[$id])) continue; // 取り下げた旧記事は復活させない
        $p['id'] = $id;
        $byId[$id] = $p;
    }
    $posts = array_values($byId);
    usort($posts, function ($a, $b) { return rz_ts($b['createdAt'] ?? '') <=> rz_ts($a['createdAt'] ?? ''); });
    return $posts;
}

function rz_is_published($post) {
    if (!is_array($post) || empty($post['createdAt'])) return false;
    $t = rz_ts($post['createdAt']);
    return $t > 0 && $t <= time();
}

function rz_published_posts() {
    return array_values(array_filter(rz_all_posts(), 'rz_is_published'));
}

function rz_get_post($id) {
    if (!rz_valid_id($id)) return null;
    foreach (rz_all_posts() as $p) {
        if ($p['id'] === $id) return $p;
    }
    return null;
}

function rz_new_id() {
    return (string)round(microtime(true) * 1000) . str_pad((string)random_int(0, 999), 3, '0', STR_PAD_LEFT);
}

function rz_iso($ts) { return gmdate('Y-m-d\TH:i:s', $ts) . '.000Z'; }

function rz_format_date($iso) { return gmdate('Y.m.d', rz_ts($iso)); }

function rz_esc($s) {
    if ($s === null || $s === '' || $s === false) return '';
    return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function rz_json($v) {
    return json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG);
}

function rz_thumb($post) {
    $map = ['LINE構築' => 'cat-line', 'DX支援' => 'cat-dx', '制作実績' => 'cat-case', 'お知らせ' => 'cat-news', 'AI活用' => 'cat-ai'];
    $t = $post['thumbnail'] ?? '';
    if ($t && preg_match('#^https?://#', $t)) return $t;
    $cat = $post['category'] ?? '';
    return '/assets-v3/blog/' . ($map[$cat] ?? 'cat-news') . '.svg';
}

function rz_truncate($text, $len) {
    $src = $text;
    if (preg_match('/<p[^>]*>([\s\S]*?)<\/p>/u', $text, $m)) $src = $m[1];
    $plain = trim(preg_replace('/\s+/u', ' ', preg_replace('/<[^>]*>/u', '', $src)));
    return mb_strlen($plain) > $len ? mb_substr($plain, 0, $len) . '...' : $plain;
}

// 見出し(h2)が3つ以上ある記事に、目次を自動で付ける
function rz_with_toc($body) {
    if (!$body || strpos($body, 'rz-toc') !== false) return $body;
    $heads = [];
    $n = 0;
    $out = preg_replace_callback('/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/u', function ($m) use (&$heads, &$n) {
        $attrs = $m[1] ?? '';
        $inner = $m[2];
        $text = trim(preg_replace('/<[^>]*>/u', '', $inner));
        if (preg_match('/\sid="([^"]+)"/', $attrs, $mm)) { $id = $mm[1]; $has = true; }
        else { $id = 'sec' . (++$n); $has = false; }
        $heads[] = ['id' => $id, 'text' => $text];
        return $has ? $m[0] : '<h2 id="' . $id . '"' . $attrs . '>' . $inner . '</h2>';
    }, $body);
    if (count($heads) < 3) return $body;
    $li = '';
    foreach ($heads as $h) {
        $li .= '<li><a href="#' . $h['id'] . '">' . str_replace('<', '&lt;', $h['text']) . '</a></li>';
    }
    $toc = '<nav class="rz-toc"><strong>目次</strong><ol>' . $li . '</ol></nav>';
    $i = strpos($out, '</p>');
    return $i === false ? $toc . $out : substr($out, 0, $i + 4) . $toc . substr($out, $i + 4);
}

// 「よくある質問」見出しの後ろの h3(質問) と p(回答) を FAQPage の構造化データにする
function rz_faq_jsonld($body) {
    $marker = '<h2>よくある質問</h2>';
    $start = strpos($body, $marker);
    if ($start === false) return '';
    $section = substr($body, $start + strlen($marker));
    if (preg_match('/<h2[\s>]/', $section, $m, PREG_OFFSET_CAPTURE)) $section = substr($section, 0, $m[0][1]);
    $strip = function ($t) { return trim(preg_replace('/\s+/u', ' ', preg_replace('/<[^>]*>/u', '', $t))); };
    $items = [];
    if (preg_match_all('/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/u', $section, $all, PREG_SET_ORDER)) {
        foreach ($all as $a) {
            $q = $strip($a[1]);
            $ans = $strip($a[2]);
            if ($q !== '' && $ans !== '') {
                $items[] = ['@type' => 'Question', 'name' => $q, 'acceptedAnswer' => ['@type' => 'Answer', 'text' => $ans]];
            }
        }
    }
    return $items ? rz_json(['@context' => 'https://schema.org', '@type' => 'FAQPage', 'mainEntity' => $items]) : '';
}

// 検索エンジンへの更新通知(IndexNow)。失敗しても処理は続ける。
function rz_indexnow($id) {
    $urls = ['https://' . RZ_HOST . '/blog-list'];
    if ($id) array_unshift($urls, 'https://' . RZ_HOST . '/blog/' . $id);
    $payload = json_encode([
        'host' => RZ_HOST,
        'key' => RZ_INDEXNOW_KEY,
        'keyLocation' => 'https://' . RZ_HOST . '/' . RZ_INDEXNOW_KEY . '.txt',
        'urlList' => $urls,
    ], JSON_UNESCAPED_SLASHES);
    if (!function_exists('curl_init')) return;
    $ch = curl_init('https://api.indexnow.org/indexnow');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json; charset=utf-8'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 4,
    ]);
    @curl_exec($ch);
    curl_close($ch);
}

function rz_tpl($name) {
    $p = rz_root() . '/_tpl/' . $name;
    return is_file($p) ? (string)file_get_contents($p) : '';
}

// 共通のページ上部(gtag・アイコン・フォント・サイトCSS)
function rz_head_common() {
    return '<meta charset="UTF-8">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-F7SZDCFSH7"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag(\'js\', new Date());
    gtag(\'config\', \'G-F7SZDCFSH7\');
  </script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">';
}

function rz_head_assets() {
    return '<link rel="icon" type="image/png" href="/favicon-32.png?v=2" sizes="32x32">
<link rel="icon" type="image/png" href="/favicon-48.png?v=2" sizes="48x48">
<link rel="icon" type="image/png" href="/favicon-192.png?v=2" sizes="192x192">
<link rel="shortcut icon" href="/favicon.ico?v=2">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/site-v3.css?v=2">';
}

function rz_src_script() {
    return '<script>try{if(!localStorage.getItem(\'raizon_src\')){var p=new URLSearchParams(location.search),r=\'\';try{r=document.referrer?new URL(document.referrer).hostname:\'\'}catch(e){}localStorage.setItem(\'raizon_src\',[p.get(\'utm_source\')||r||\'direct\',p.get(\'utm_medium\')||\'\',p.get(\'utm_campaign\')||\'\',location.pathname].join(\'|\'))}}catch(e){}</script>';
}
