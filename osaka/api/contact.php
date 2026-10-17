<?php
// 東大阪サイトのお問い合わせフォームの受付。RAIZON(raizon.asahi@gmail.com)にメールで届ける。
require dirname(__DIR__) . '/_lib/mail.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') rz_json_out(405, ['error' => 'Method not allowed']);

$b = rz_request_body();
$get = function ($k) use ($b) { return isset($b[$k]) && is_scalar($b[$k]) ? trim((string)$b[$k]) : ''; };
$name = $get('name'); $email = $get('email'); $company = $get('company'); $message = $get('message');
$kind = $get('kind'); $budget = $get('budget'); $source = $get('source'); $website = $get('website');
$phone = $get('tel') !== '' ? $get('tel') : $get('phone');

// ハニーポット: 人には見えない欄に値が入っていたら、迷惑な自動送信とみなして成功を装って破棄する
if ($website !== '') rz_json_out(200, ['ok' => true]);

if ($name === '' || $email === '' || $message === '' || $kind === '') rz_json_out(400, ['error' => '必須項目が未入力です']);
if (($b['agree'] ?? false) !== true) rz_json_out(400, ['error' => 'プライバシーポリシーへの同意が必要です']);
if (!rz_valid_email($email) || mb_strlen($name) > 100 || mb_strlen($message) > 5000 || mb_strlen($company) > 200 || mb_strlen($phone) > 40 || mb_strlen($kind) > 40 || mb_strlen($budget) > 100) {
    rz_json_out(400, ['error' => '入力内容を確認してください']);
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (rz_rate_limited('osaka-contact:' . $ip)) rz_json_out(429, ['error' => '送信回数が多すぎます。しばらくしてからお試しください']);

$text = implode("\n", [
    'ご用件: ' . mb_substr($kind, 0, 40),
    'お名前: ' . $name,
    'メールアドレス: ' . $email,
    '電話番号: ' . ($phone !== '' ? $phone : '未入力'),
    '会社名・屋号: ' . ($company !== '' ? $company : '未入力'),
    'ご予算: ' . ($budget !== '' ? mb_substr($budget, 0, 100) : '未選択'),
    '流入元(サイトに来たきっかけ): ' . mb_substr($source !== '' ? $source : '不明', 0, 200),
    '',
    'ご相談内容:',
    $message,
]);

try {
    rz_send_mail('RAIZON東大阪サイト', 'raizon.asahi@gmail.com', '【東大阪サイトお問い合わせ・' . mb_substr($kind, 0, 40) . '】' . $name . '様より', $text, $email);
    rz_json_out(200, ['ok' => true]);
} catch (Throwable $e) {
    error_log('osaka contact mail error: ' . $e->getMessage());
    rz_json_out(500, ['error' => 'メール送信に失敗しました', 'reason' => rz_mail_reason($e)]);
}
