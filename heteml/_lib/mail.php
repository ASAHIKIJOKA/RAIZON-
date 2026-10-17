<?php
// メール送信(Gmail の SMTP に直接つなぐ。今のVercel版と同じ送信元・宛先)
// 設定: _secrets/mail.json { "user": "raizon.asahi@gmail.com", "pass": "<アプリパスワード>" }
//   → scripts/make-mail-config.js で作る。外からは見えないフォルダに置く。

function rz_mail_config() {
    $cfg = json_decode((string)@file_get_contents(dirname(__DIR__) . '/_secrets/mail.json'), true);
    return (is_array($cfg) && !empty($cfg['user']) && !empty($cfg['pass'])) ? $cfg : null;
}

function rz_mime_header($s) {
    return '=?UTF-8?B?' . base64_encode($s) . '?=';
}

function rz_smtp_read($fp) {
    $data = '';
    while (($line = fgets($fp, 1024)) !== false) {
        $data .= $line;
        if (strlen($line) < 4 || $line[3] === ' ') break;
    }
    return $data;
}

function rz_smtp_cmd($fp, $cmd, $expect) {
    if ($cmd !== null) fwrite($fp, $cmd . "\r\n");
    $res = rz_smtp_read($fp);
    if (strpos($res, (string)$expect) !== 0) throw new Exception('SMTP error: ' . trim(substr($res, 0, 120)));
    return $res;
}

// $attachments: [['filename' => ..., 'path' => ..., 'type' => 'application/pdf'], ...]
function rz_send_mail($fromName, $to, $subject, $text, $replyTo = null, $attachments = []) {
    $cfg = rz_mail_config();
    if (!$cfg) throw new Exception('not_configured');
    $from = $cfg['user'];

    $headers = [
        'From: ' . rz_mime_header($fromName) . ' <' . $from . '>',
        'To: <' . $to . '>',
        'Subject: ' . rz_mime_header($subject),
        'Date: ' . date('r'),
        'Message-ID: <' . bin2hex(random_bytes(12)) . '@raizon-okinawa.com>',
        'MIME-Version: 1.0',
    ];
    if ($replyTo) $headers[] = 'Reply-To: <' . $replyTo . '>';

    $textPart = "Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($text));
    if (!$attachments) {
        $headers[] = 'Content-Type: text/plain; charset=UTF-8';
        $headers[] = 'Content-Transfer-Encoding: base64';
        $body = chunk_split(base64_encode($text));
    } else {
        $boundary = 'rz_' . bin2hex(random_bytes(10));
        $headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';
        $body = '--' . $boundary . "\r\n" . $textPart;
        foreach ($attachments as $a) {
            $data = @file_get_contents($a['path']);
            if ($data === false) continue;
            $body .= '--' . $boundary . "\r\n"
                . 'Content-Type: ' . $a['type'] . '; name="' . rz_mime_header($a['filename']) . "\"\r\n"
                . "Content-Transfer-Encoding: base64\r\n"
                . 'Content-Disposition: attachment; filename="' . rz_mime_header($a['filename']) . "\"\r\n\r\n"
                . chunk_split(base64_encode($data));
        }
        $body .= '--' . $boundary . "--\r\n";
    }

    $fp = @stream_socket_client('ssl://smtp.gmail.com:465', $errno, $errstr, 10);
    if (!$fp) throw new Exception('connect');
    stream_set_timeout($fp, 15);
    try {
        rz_smtp_cmd($fp, null, 220);
        rz_smtp_cmd($fp, 'EHLO raizon-okinawa.com', 250);
        rz_smtp_cmd($fp, 'AUTH LOGIN', 334);
        rz_smtp_cmd($fp, base64_encode($cfg['user']), 334);
        try { rz_smtp_cmd($fp, base64_encode($cfg['pass']), 235); } catch (Throwable $e) { throw new Exception('auth'); }
        rz_smtp_cmd($fp, 'MAIL FROM:<' . $from . '>', 250);
        rz_smtp_cmd($fp, 'RCPT TO:<' . $to . '>', 250);
        rz_smtp_cmd($fp, 'DATA', 354);
        fwrite($fp, implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.\r\n");
        rz_smtp_cmd($fp, null, 250);
        @rz_smtp_cmd($fp, 'QUIT', 221);
    } finally {
        fclose($fp);
    }
}

// 迷惑送信への簡易対策: 同じIPから10分に5回まで
function rz_rate_limited($key) {
    $dir = dirname(__DIR__) . '/_data';
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    $file = $dir . '/rate.json';
    $now = time();
    $map = json_decode((string)@file_get_contents($file), true);
    if (!is_array($map)) $map = [];
    foreach ($map as $k => $times) {
        $map[$k] = array_values(array_filter($times, function ($t) use ($now) { return $t > $now - 600; }));
        if (!$map[$k]) unset($map[$k]);
    }
    $hits = $map[$key] ?? [];
    if (count($hits) >= 5) { @file_put_contents($file, json_encode($map), LOCK_EX); return true; }
    $hits[] = $now;
    $map[$key] = $hits;
    @file_put_contents($file, json_encode($map), LOCK_EX);
    return false;
}

function rz_json_out($code, $data) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function rz_request_body() {
    $b = json_decode((string)file_get_contents('php://input'), true);
    return is_array($b) ? $b : [];
}

function rz_valid_email($e) {
    return preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $e) === 1;
}

// 失敗の種類だけを返す(パスワードや詳細は含めない)
function rz_mail_reason($e) {
    $m = $e->getMessage();
    foreach (['not_configured', 'connect', 'auth'] as $k) if ($m === $k) return $k;
    return 'smtp';
}
