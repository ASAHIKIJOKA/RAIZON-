const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const { name, email, phone, company, services, message, website, source } = body || {};
  // ハニーポット: 人には見えない入力欄に値が入っていたら、迷惑な自動送信とみなして、成功を装って破棄する
  if (website) return res.status(200).json({ ok: true });
  if (!name || !email || !phone || !message) {
    return res.status(400).json({ error: '必須項目が未入力です' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email)) || String(name).length > 100 || String(message).length > 5000 || String(company || '').length > 200 || String(phone).length > 40) {
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
      subject: `【サイトお問い合わせ】${name}様より`,
      text: [
        `お名前: ${name}`,
        `メールアドレス: ${email}`,
        `電話番号: ${phone || '未入力'}`,
        `会社名・屋号: ${company || '未入力'}`,
        `ご興味のあるサービス: ${services || '未選択'}`,
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
