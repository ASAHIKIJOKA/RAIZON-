// ========================================
// Firebase Realtime Database アクセス(サーバー側専用)
// 認証情報は Vercel の環境変数から読む。ブラウザには絶対に渡さない。
//   FIREBASE_SECRET   : Firebase のデータベースシークレット
//   FIREBASE_DB_URL   : (任意)DB の URL
// ========================================

const DB_URL = (process.env.FIREBASE_DB_URL || 'https://parlor-minato-default-rtdb.firebaseio.com').replace(/\/$/, '');
const POSTS_PATH = 'raizon-blog/posts';

function isValidId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id);
}

async function request(path, method = 'GET', body) {
  const secret = process.env.FIREBASE_SECRET;
  if (!secret) throw new Error('FIREBASE_SECRET is not set');
  const r = await fetch(`${DB_URL}/${path}.json?auth=${encodeURIComponent(secret)}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`Firebase ${method} ${path} failed: ${r.status}`);
  return data;
}

async function getAllPosts() {
  const data = await request(POSTS_PATH);
  if (!data) return [];
  return Object.entries(data)
    .map(([id, post]) => ({ ...post, id }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getPost(id) {
  if (!isValidId(id)) return null;
  const data = await request(`${POSTS_PATH}/${id}`);
  return data ? { ...data, id } : null;
}

async function putPost(id, post) {
  return request(`${POSTS_PATH}/${id}`, 'PUT', post);
}

async function patchPost(id, updates) {
  return request(`${POSTS_PATH}/${id}`, 'PATCH', updates);
}

async function deletePost(id) {
  return request(`${POSTS_PATH}/${id}`, 'DELETE');
}

module.exports = { isValidId, getAllPosts, getPost, putPost, patchPost, deletePost };
