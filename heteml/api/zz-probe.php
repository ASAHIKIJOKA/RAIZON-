<?php
// 一時的な計測用(確認後に削除する)
require dirname(__DIR__) . '/_lib/mail.php';
@set_time_limit(170);
header('Content-Type: application/json; charset=utf-8');
$t = [];
$s = microtime(true);
try { rz_send_mail('RAIZON計測', 'raizon.asahi@gmail.com', '【動作確認】計測(添付なし)', 'probe', null); } catch (Throwable $e) { $t['small_err'] = $e->getMessage(); }
$t['small'] = round(microtime(true) - $s, 2);
$s = microtime(true);
$pdf = [['filename' => 'terms.pdf', 'path' => dirname(__DIR__) . '/legal/raizon-terms-v1.1.pdf', 'type' => 'application/pdf']];
try { rz_send_mail('RAIZON計測', 'raizon.asahi@gmail.com', '【動作確認】計測(PDFつき)', 'probe', null, $pdf); } catch (Throwable $e) { $t['pdf_err'] = $e->getMessage(); }
$t['pdf'] = round(microtime(true) - $s, 2);
$t['pdf_bytes'] = @filesize(dirname(__DIR__) . '/legal/raizon-terms-v1.1.pdf');
$t['sapi'] = php_sapi_name();
$t['fcgi_finish'] = function_exists('fastcgi_finish_request');
echo json_encode($t);
