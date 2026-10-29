<?php
// サービスのお申し込み(/apply)の受付。RAIZONに申込内容を、お客様に受付メールを送る。
// 契約は、お客様が「この内容で申し込む」を押して送信した時点で成立する(利用規約 第1.1版 第4条)。
// 同意の記録として、日時・規約の版・IPアドレス・ブラウザ情報をRAIZON宛のメールに残す。
require dirname(__DIR__) . '/_lib/mail.php';
@set_time_limit(120);

const RZ_TERMS_VERSION = '1.1';
$FIELDS = [
    ['plan', 'プラン', 200], ['payment', 'お支払い方法', 100], ['quote', 'お見積もり番号・金額', 200], ['company', '会社名・屋号', 200],
    ['representative', '代表者名', 100], ['contact', 'ご担当者名', 100], ['address', '所在地', 300],
    ['phone', '電話番号', 40], ['email', 'メールアドレス', 200], ['industry', '業種', 100],
    ['lineAccount', 'LINE公式アカウント', 50], ['start', '利用開始の希望時期', 100], ['note', 'ご要望・備考', 3000],
];
$REQUIRED = ['plan', 'payment', 'company', 'representative', 'address', 'phone', 'email', 'lineAccount'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') rz_json_out(405, ['error' => 'Method not allowed']);

$b = rz_request_body();
// ハニーポット
if (!empty($b['website'])) rz_json_out(200, ['ok' => true]);

$d = [];
foreach ($FIELDS as [$k, , $max]) {
    $v = isset($b[$k]) && is_scalar($b[$k]) ? trim((string)$b[$k]) : '';
    $d[$k] = mb_substr($v, 0, $max);
}
foreach ($REQUIRED as $k) {
    if ($d[$k] === '') rz_json_out(400, ['error' => '必須項目が未入力です']);
}
if (!rz_valid_email($d['email'])) rz_json_out(400, ['error' => 'メールアドレスを確認してください']);
if (($b['agreeTerms'] ?? '') !== 'yes' || ($b['agreeImportant'] ?? '') !== 'yes') rz_json_out(400, ['error' => '規約と確認事項への同意が必要です']);

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (rz_rate_limited('apply:' . $ip)) rz_json_out(429, ['error' => '送信回数が多すぎます。しばらくしてからお試しください']);

$tz = new DateTimeZone('Asia/Tokyo');
$at = (new DateTime('now', $tz))->format('Y/n/j H:i:s');
$ua = mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '不明', 0, 300);
$lines = [];
foreach ($FIELDS as [$k, $label]) $lines[] = $label . ': ' . ($d[$k] !== '' ? $d[$k] : '—');

$pdf = [[
    'filename' => 'RAIZONサービス利用規約_第' . RZ_TERMS_VERSION . '版.pdf',
    'path' => dirname(__DIR__) . '/legal/raizon-terms-v1.1.pdf',
    'type' => 'application/pdf',
]];

try {
    rz_send_mail('RAIZON申込フォーム', 'raizon.asahi@gmail.com', '【お申し込み】' . $d['company'] . '様（' . $d['plan'] . '）', implode("\n", array_merge(
        ['新しいお申し込み(契約成立)がありました。お客様へ、振込先とサービス開始のご案内を送ってください。', ''],
        $lines,
        ['', '--- 同意の記録 ---',
         '受付日時: ' . $at,
         '同意した規約: サービス利用規約 第' . RZ_TERMS_VERSION . '版(https://raizon-okinawa.com/terms)',
         '利用規約への同意: あり / 確認事項の確認: あり',
         'IPアドレス: ' . $ip,
         'ブラウザ: ' . $ua]
    )), $d['email']);

    rz_send_mail('RAIZON', $d['email'], '【RAIZON】お申し込みを受け付けました', implode("\n", array_merge(
        [$d['company'] . '　' . $d['representative'] . '様', '',
         'このたびは、RAIZONのサービスにお申し込みいただき、ありがとうございます。',
         '以下の内容で、お申し込みを受け付け、ご契約が成立しました。',
         'お支払い(振込先など)とサービス開始のご案内を、2営業日以内に、当社からご連絡します。', ''],
        $lines,
        ['', '受付日時: ' . $at,
         '同意いただいた規約: サービス利用規約 第' . RZ_TERMS_VERSION . '版（このメールにPDFを添付しています。大切に保管してください）',
         'https://raizon-okinawa.com/terms', '',
         'お心当たりのない場合や、内容に誤りがある場合は、このメールにご返信ください。', '',
         'RAIZON（ライゾン）',
         '沖縄県中頭郡北谷町字砂辺301-7',
         'raizon.asahi@gmail.com / 080-6493-7744']
    )), 'raizon.asahi@gmail.com', $pdf);

    rz_json_out(200, ['ok' => true]);
} catch (Throwable $e) {
    error_log('apply mail error: ' . $e->getMessage());
    rz_json_out(500, ['error' => 'メール送信に失敗しました', 'reason' => rz_mail_reason($e)]);
}
