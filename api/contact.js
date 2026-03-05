const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, company, services, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: '必須項目が未入力です' });
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
        `会社名・屋号: ${company || '未入力'}`,
        `ご興味のあるサービス: ${services || '未選択'}`,
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
