const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const { name, email, company, services, message, website, source, kind, budget, agree } = body || {};
  // 東大阪トップ(site/)は電話番号を tel で送り、任意項目。従来のフォームは phone で送り、必須
  const phone = (body && (body.phone || body.tel)) || '';
  const isOsakaForm = !!kind;
  // ハニーポット: 人には見えない入力欄に値が入っていたら、迷惑な自動送信とみなして、成功を装って破棄する
  if (website) return res.status(200).json({ ok: true });
  if (!name || !email || !message || (!isOsakaForm && !phone)) {
    return res.status(400).json({ error: '必須項目が未入力です' });
  }
  if (isOsakaForm && agree !== true) {
    return res.status(400).json({ error: 'プライバシーポリシーへの同意が必要です' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email)) || String(name).length > 100 || String(message).length > 5000 || String(company || '').length > 200 || String(phone).length > 40 || String(kind || '').length > 40 || String(budget || '').length > 100) {
    return res.status(400).json({ error: '入力内容を確認してください' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'raizon.asahi@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: '"RAIZONサイト" <raizon.asahi@gmail.com>',
      to: 'raizon.asahi@gmail.com',
      replyTo: email,
      subject: `【サイトお問い合わせ${kind ? '・' + String(kind).slice(0, 40) : ''}】${name}様より`,
      text: [
        ...(kind ? [`ご用件: ${String(kind).slice(0, 40)}`] : []),
        `お名前: ${name}`,
        `メールアドレス: ${email}`,
        `電話番号: ${phone || '未入力'}`,
        `会社名・屋号: ${company || '未入力'}`,
        ...(isOsakaForm ? [`ご予算: ${String(budget || '未選択').slice(0, 100)}`] : [`ご興味のあるサービス: ${services || '未選択'}`]),
        `流入元(サイトに来たきっかけ): ${String(source || '不明').slice(0, 200)}`,
        '',
        `ご相談内容:`,
        message,
      ].join('\n'),
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: 'メール送信に失敗しました' });
  }
};
