// ========================================
// 公開API: ブログ記事の取得(読み取り専用)
//   GET /api/posts          → 記事一覧
//   GET /api/posts?id=xxx   → 記事1件
// ========================================

const { isValidId, isPublished, getPublishedPosts, getPost } = require('./_firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  try {
    const id = req.query.id;
    if (id !== undefined) {
      if (!isValidId(id)) return res.status(400).json({ error: 'invalid id' });
      const post = await getPost(id);
      if (!post || !isPublished(post)) return res.status(404).json({ error: 'not found' });
      return res.status(200).json(post);
    }
    return res.status(200).json(await getPublishedPosts());
  } catch (e) {
    console.error('posts api error:', e.message);
    return res.status(500).json({ error: 'server error' });
  }
};
