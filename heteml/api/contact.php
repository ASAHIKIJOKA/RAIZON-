<?php
// お問い合わせフォームの受付。RAIZON(raizon.asahi@gmail.com)にメールで届ける。
require dirname(__DIR__) . '/_lib/mail.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') rz_json_out(405, ['error' => 'Method not allowed']);

$b = rz_request_body();
$get = function ($k) use ($b) { return isset($b[$k]) && is_scalar($b[$k]) ? trim((string)$b[$k]) : ''; };
$name = $get('name'); $email = $get('email'); $phone = $get('phone'); $company = $get('company');
$services = $get('services'); $message = $get('message'); $website = $get('website'); $source = $get('source');

// ハニーポット: 人には見えない欄に値が入っていたら、迷惑な自動送信とみなして成功を装って破棄する
if ($website !== '') rz_json_out(200, ['ok' => true]);

if ($name === '' || $email === '' || $phone === '' || $message === '') rz_json_out(400, ['error' => '必須項目が未入力です']);
if (!rz_valid_email($email) || mb_strlen($name) > 100 || mb_strlen($message) > 5000 || mb_strlen($company) > 200 || mb_strlen($phone) > 40) {
    rz_json_out(400, ['error' => '入力内容を確認してください']);
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (rz_rate_limited('contact:' . $ip)) rz_json_out(429, ['error' => '送信回数が多すぎます。しばらくしてからお試しください']);

$text = implode("\n", [
    'お名前: ' . $name,
    'メールアドレス: ' . $email,
    '電話番号: ' . ($phone ?: '未入力'),
    '会社名・屋号: ' . ($company ?: '未入力'),
    'ご興味のあるサービス: ' . ($services ?: '未選択'),
    '流入元(サイトに来たきっかけ): ' . mb_substr($source ?: '不明', 0, 200),
    '',
    'ご相談内容:',
    $message,
]);

try {
    rz_send_mail('RAIZONサイト', 'raizon.asahi@gmail.com', '【サイトお問い合わせ】' . $name . '様より', $text, $email);
    rz_json_out(200, ['ok' => true]);
} catch (Throwable $e) {
    error_log('contact mail error: ' . $e->getMessage());
    rz_json_out(500, ['error' => 'メール送信に失敗しました', 'reason' => rz_mail_reason($e)]);
}
