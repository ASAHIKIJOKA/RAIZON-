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

// ファイル管理の記事(content/articles → api/_posts-static.json)。自動投稿で使う。
// 同じidがDBにもある場合は、ファイル側を正とする。
const { svgThumbnail } = require('./_thumb');
function staticPosts() {
  try {
    return require('./_posts-static.json').map(p => ({ ...p, thumbnail: p.thumbnail || svgThumbnail(p.title, p.category) }));
  } catch (e) {
    return [];
  }
}

// 非表示にする記事(DBに残っている旧記事など)。DBのデータは消さずに、公開だけ止める。
function hiddenIds() {
  try { return new Set(require('./_hidden-ids.json')); } catch (e) { return new Set(); }
}

async function getAllPosts() {
  const data = await request(POSTS_PATH).catch(e => { if (staticPosts().length === 0) throw e; console.error('DB read failed, using file posts only:', e.message); return null; });
  const fromDb = data ? Object.entries(data).map(([id, post]) => ({ ...post, id })) : [];
  const files = staticPosts();
  const fileIds = new Set(files.map(p => p.id));
  const hidden = hiddenIds();
  return [...files, ...fromDb.filter(p => !fileIds.has(p.id) && !hidden.has(p.id))]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// 予約投稿: createdAt(公開日時)が未来の記事は、公開日まで一般公開しない
function isPublished(post, now = Date.now()) {
  if (!post || !post.createdAt) return false;
  const t = new Date(post.createdAt).getTime();
  return !Number.isNaN(t) && t <= now;
}

async function getPublishedPosts() {
  const now = Date.now();
  return (await getAllPosts()).filter(p => isPublished(p, now));
}

async function getPost(id) {
  if (!isValidId(id)) return null;
  const fromFile = staticPosts().find(p => p.id === id);
  if (fromFile) return fromFile;
  if (hiddenIds().has(id)) return null;
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

module.exports = { isValidId, isPublished, hiddenIds, getAllPosts, getPublishedPosts, getPost, putPost, patchPost, deletePost };
