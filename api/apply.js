// サービスのお申し込み(/apply)の受付。RAIZONに申込内容を、お客様に受付メールを送る。
// 契約は、RAIZONが内容を確認して「承諾の連絡」を送った時点で成立する(利用規約 第4条)。
// 同意の記録として、日時・規約の版・IPアドレス・ブラウザ情報をRAIZON宛のメールに残す。
const nodemailer = require('nodemailer');

const TERMS_VERSION = '1.0';
const FIELDS = [
  ['plan', 'プラン', 200], ['quote', 'お見積もり番号・金額', 200], ['company', '会社名・屋号', 200],
  ['representative', '代表者名', 100], ['contact', 'ご担当者名', 100], ['address', '所在地', 300],
  ['phone', '電話番号', 40], ['email', 'メールアドレス', 200], ['industry', '業種', 100],
  ['lineAccount', 'LINE公式アカウント', 50], ['start', '利用開始の希望時期', 100], ['note', 'ご要望・備考', 3000],
];
const REQUIRED = ['plan', 'company', 'representative', 'address', 'phone', 'email', 'lineAccount'];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  // ハニーポット: 人には見えない入力欄に値が入っていたら、自動送信とみなして成功を装って破棄する
  if (body.website) return res.status(200).json({ ok: true });

  const d = {};
  for (const [k, , max] of FIELDS) d[k] = String(body[k] || '').trim().slice(0, max);
  if (REQUIRED.some((k) => !d[k])) return res.status(400).json({ error: '必須項目が未入力です' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return res.status(400).json({ error: 'メールアドレスを確認してください' });
  if (body.agreeTerms !== 'yes' || body.agreeImportant !== 'yes') return res.status(400).json({ error: '規約と確認事項への同意が必要です' });

  const at = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || '不明';
  const ua = String(req.headers['user-agent'] || '不明').slice(0, 300);
  const lines = FIELDS.map(([k, label]) => `${label}: ${d[k] || '—'}`);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: 'raizon.asahi@gmail.com', pass: process.env.GMAIL_APP_PASSWORD },
  });

  try {
    await transporter.sendMail({
      from: '"RAIZON申込フォーム" <raizon.asahi@gmail.com>',
      to: 'raizon.asahi@gmail.com',
      replyTo: d.email,
      subject: `【お申し込み】${d.company}様（${d.plan}）`,
      text: [
        '新しいお申し込みがありました。内容を確認し、承諾する場合はお客様へ承諾の連絡を送ってください(送った時点で契約成立)。',
        '',
        ...lines,
        '',
        '--- 同意の記録 ---',
        `受付日時: ${at}`,
        `同意した規約: サービス利用規約 第${TERMS_VERSION}版(https://raizon-okinawa.com/terms)`,
        '利用規約への同意: あり / 確認事項の確認: あり',
        `IPアドレス: ${ip}`,
        `ブラウザ: ${ua}`,
      ].join('\n'),
    });
    await transporter.sendMail({
      from: '"RAIZON" <raizon.asahi@gmail.com>',
      to: d.email,
      replyTo: 'raizon.asahi@gmail.com',
      subject: '【RAIZON】お申し込みを受け付けました',
      text: [
        `${d.company}　${d.representative}様`,
        '',
        'このたびは、RAIZONのサービスにお申し込みいただき、ありがとうございます。',
        '以下の内容で、お申し込みを受け付けました。',
        '内容を確認のうえ、2営業日以内に、当社から承諾のご連絡をいたします。承諾のご連絡をした時点で、ご契約が成立します。',
        '',
        ...lines,
        '',
        `受付日時: ${at}`,
        `同意いただいた規約: サービス利用規約 第${TERMS_VERSION}版`,
        'https://raizon-okinawa.com/terms',
        '',
        'お心当たりのない場合や、内容に誤りがある場合は、このメールにご返信ください。',
        '',
        'RAIZON（ライゾン）',
        '沖縄県中頭郡北谷町字砂辺301-7',
        'raizon.asahi@gmail.com / 080-6493-7744',
      ].join('\n'),
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('apply mail error:', err);
    return res.status(500).json({ error: 'メール送信に失敗しました' });
  }
};
