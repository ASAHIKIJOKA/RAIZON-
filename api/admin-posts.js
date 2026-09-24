// ========================================
// 管理API: ブログ記事の作成・更新・削除(パスワード認証必須)
//   POST /api/admin-posts
//   ヘッダー  x-admin-password: 管理パスワード(環境変数 ADMIN_PASSWORD と照合)
//   body      { action: 'verify' | 'add' | 'update' | 'put' | 'delete', id?, post? }
// ========================================

const crypto = require('crypto');
const { isValidId, putPost, patchPost, deletePost } = require('./_firebase');

const HOST = 'raizon-okinawa.com';
const INDEXNOW_KEY = 'e05e507884b16deb8e3fa6c6771abddc';
const ALLOWED_FIELDS = ['title', 'body', 'category', 'thumbnail', 'createdAt', 'updatedAt'];

function passwordMatches(input) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof input !== 'string') return false;
  const a = crypto.createHash('sha256').update(input).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function pickFields(post) {
  const out = {};
  for (const key of ALLOWED_FIELDS) {
    if (post && post[key] !== undefined) out[key] = post[key];
  }
  return out;
}

async function notifyIndexNow(id) {
  const urlList = [`https://${HOST}/blog-list`];
  if (id) urlList.unshift(`https://${HOST}/blog-post?id=${id}`);
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });
  } catch (e) {
    console.error('IndexNow notify failed:', e.message);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD is not set');
    return res.status(500).json({ error: 'server not configured' });
  }
  if (!passwordMatches(req.headers['x-admin-password'])) {
    await new Promise(r => setTimeout(r, 500)); // 総当たり対策の遅延
    return res.status(401).json({ error: 'unauthorized' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const { action, id, post } = body || {};

  try {
    if (action === 'verify') return res.status(200).json({ ok: true });

    const now = new Date().toISOString();

    if (action === 'add') {
      const newId = Date.now().toString();
      const data = { ...pickFields(post), updatedAt: now };
      data.createdAt = data.createdAt || now;
      await putPost(newId, data);
      await notifyIndexNow(newId);
      return res.status(200).json({ ...data, id: newId });
    }

    if (!isValidId(id)) return res.status(400).json({ error: 'invalid id' });

    if (action === 'put') {
      const data = { ...pickFields(post), updatedAt: post && post.updatedAt ? post.updatedAt : now };
      await putPost(id, data);
      return res.status(200).json({ ...data, id });
    }

    if (action === 'update') {
      const data = { ...pickFields(post), updatedAt: now };
      await patchPost(id, data);
      await notifyIndexNow(id);
      return res.status(200).json({ ...data, id });
    }

    if (action === 'delete') {
      await deletePost(id);
      await notifyIndexNow(null);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'unknown action' });
  } catch (e) {
    console.error('admin-posts error:', e.message);
    return res.status(500).json({ error: 'server error' });
  }
};
